import {
    type Card as CardType,
    type GameState,
    type MatchInfo,
    type PlayerState,
    type Point,
    type Suit,
} from "./types/types";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import Alerts from "./components/Alerts";
import { useAlerts } from "./hooks/useAlerts";
import CardPile from "./components/CardPile";
import DeckGraphic from "./components/DeckGraphic";
import { useFloatInstr } from "./hooks/useFloatInstr";
import FloatingCards from "./components/FloatingCards";

type DeckMap = Map<string, number>;

const NOT_PLACING = 0;

function App() {
    const cardWidth = 180;
    const numPlayerCards = 4;
    const numDecks = 1;
    const currentPlayerNum = 1;
    const oppPlayerNum = 0;
    const cpuTimeout = 4; // seconds
    const cpuSecondMoveTimeout = 1; // seconds

    const [gameState, setGameState] = createSignal(generateInitial(numDecks));
    const [cpuMatches, setCpuMatches] = createSignal(getMatches());
    const [playerMatches, setPlayerMatches] = createSignal(getMatches());
    const [currentPlacing, setCurrentPlacing] = createSignal<MatchInfo>({
        number: NOT_PLACING,
        id: "",
    });
    const [alerts, addAlert] = useAlerts();
    const [cpuInterval, setCpuInterval] = createSignal(-1);

    const [topDeckRef, setTopDeckRef] = createSignal<HTMLDivElement | undefined>(undefined);
    const [floatInstructions, addFloatInstruction] = useFloatInstr();

    function generateInitial(numDecks: number): GameState {
        const res: GameState = { wonBy: null, cardState: [] };

        const player1: PlayerState = { hand: [], side: [] };
        const player2: PlayerState = { hand: [], side: [] };

        const deckMap: DeckMap = newDeckMap(numDecks);

        for (let i = 0; i < (52 * numDecks) / 2; i++) {
            const card1 = randomCard(deckMap);
            player1.hand.push(card1);

            const card2 = randomCard(deckMap);
            player2.hand.push(card2);
        }

        player1.side = player1.hand.splice(0, numPlayerCards).map((card) => [card]);
        player2.side = player2.hand.splice(0, numPlayerCards).map((card) => [card]);

        res.cardState.push(player1, player2);

        return res;
    }

    function newDeckMap(numDecks: number): DeckMap {
        const res = new Map<string, number>();

        insertMapCards(res, "diamonds", numDecks);
        insertMapCards(res, "spades", numDecks);
        insertMapCards(res, "hearts", numDecks);
        insertMapCards(res, "clubs", numDecks);

        return res;
    }

    function insertMapCards(deckMap: DeckMap, suit: Suit, numDecks: number) {
        for (let i = 1; i <= 13; i++) {
            deckMap.set(`${suit}-${i}`, numDecks);
        }
    }

    function randomCard(deckMap: DeckMap): CardType {
        const keys = Array.from(deckMap.keys());
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const value = deckMap.get(randomKey)!;

        if (value > 1) {
            deckMap.set(randomKey, value - 1);
        } else {
            deckMap.delete(randomKey);
        }

        const parts = randomKey.split("-");
        return {
            id: crypto.randomUUID(),
            number: +parts[1],
            suit: parts[0] as Suit,
            placedBy: "none",
        };
    }

    function getMatches(): MatchInfo[] {
        const idSet = new Set<string>();
        const matches: MatchInfo[] = [];
        const allCards = gameState()
            .cardState.map((player) => player.side)
            .flat();

        for (let i = 0; i < allCards.length; i++) {
            for (let j = 0; j < allCards.length; j++) {
                if (i === j) continue;

                const topICard = allCards[i][allCards[i].length - 1];
                const topJCard = allCards[j][allCards[j].length - 1];
                if (topICard.number == topJCard.number) {
                    if (!idSet.has(topICard.id)) {
                        matches.push({
                            number: topICard.number,
                            id: topICard.id,
                        });
                    }
                }
            }
        }

        return [...matches];
    }

    function handleCardClick(playerNum: number, id: string, toPos: Point) {
        const deckRef = topDeckRef();
        if (!deckRef || currentPlacing().id === id) return;

        const cardStack = gameState().cardState[playerNum].side.find(
            (item) => item[item.length - 1].id === id,
        );
        if (!cardStack) return;
        const card = cardStack[cardStack.length - 1];

        if (currentPlacing().number === NOT_PLACING || currentPlacing().number !== card.number) {
            const newMatches = getMatches();
            setPlayerMatches(newMatches);
            setCurrentPlacing((prev) => {
                prev.number = card.number;
                return { ...prev };
            });
        }

        const includesCard = [...playerMatches(), ...cpuMatches()].find(
            (item) => item.number === card.number && item.id === card.id,
        );
        if (!includesCard) return;

        const newGameState = gameState();
        for (let i = 0; i < newGameState.cardState[playerNum].side.length; i++) {
            const cardStack = newGameState.cardState[playerNum].side[i];
            if (cardStack[cardStack.length - 1].id === id) {
                resetTaggedPlacedCards(newGameState);
                const fromHand = newGameState.cardState[currentPlayerNum].hand.pop()!;
                fromHand.placedBy = "player";
                newGameState.cardState[playerNum].side[i].push(fromHand);

                const rect = deckRef.getBoundingClientRect();
                const from: Point = { x: rect.x, y: rect.y };
                addFloatInstruction({ id: crypto.randomUUID(), from, to: toPos, card: fromHand });

                if (newGameState.cardState[currentPlayerNum].hand.length === 0) {
                    newGameState.wonBy = currentPlayerNum;
                    setGameState({ ...newGameState });
                    return;
                }

                break;
            }
        }

        setGameState({ ...newGameState });
    }

    function tryNewCards() {
        let hasMatches = getMatches().length > 0;

        const currentCpuMatches = cpuMatches();
        const allCards = gameState()
            .cardState.map((state) => state.side)
            .flat()
            .map((pile) => pile[pile.length - 1]);
        for (const match of currentCpuMatches) {
            if (allCards.find((item) => item.id === match.id)) {
                hasMatches = true;
                break;
            }
        }

        if (hasMatches) {
            addAlert("There are still matches");
            return;
        }

        const currentGameState = gameState();

        const player1Hand = currentGameState.cardState[currentPlayerNum].hand;
        player1Hand.unshift(...currentGameState.cardState[currentPlayerNum].side.flat());
        const player1Top4 = player1Hand.splice(player1Hand.length - 4, 4);
        currentGameState.cardState[currentPlayerNum].side = player1Top4.map((card) => {
            card.placedBy = "none";
            return [card];
        });

        const player2Hand = currentGameState.cardState[oppPlayerNum].hand;
        player2Hand.unshift(...currentGameState.cardState[oppPlayerNum].side.flat());
        const player2Top4 = player2Hand.splice(player2Hand.length - 4, 4);
        currentGameState.cardState[oppPlayerNum].side = player2Top4.map((card) => {
            card.placedBy = "none";
            return [card];
        });

        setGameState({ ...currentGameState });
    }

    /// return null if game won, true if card placed, false if not placed
    function cpuPutCard(cardId: string): boolean | null {
        const newGameState = gameState();
        const allStacks = newGameState.cardState.map((state) => state.side).flat();
        for (let i = 0; i < allStacks.length; i++) {
            const topICard = allStacks[i][allStacks[i].length - 1];
            if (topICard.id === cardId) {
                resetTaggedPlacedCards(newGameState);
                const hand = newGameState.cardState[oppPlayerNum].hand;
                const handCard = hand.pop()!;
                handCard.placedBy = "cpu";
                allStacks[i].push(handCard);

                if (hand.length === 0) {
                    newGameState.wonBy = oppPlayerNum;
                    setGameState({ ...newGameState });
                    return null;
                }

                setGameState({ ...newGameState });
                return true;
            }
        }

        return false;
    }

    function cpuMakeMove() {
        setCpuMatches(getMatches());
        const currentMatches = randomizeArr(cpuMatches());
        if (currentMatches.length === 0) return;

        const first = currentMatches[Math.floor(Math.random() * currentMatches.length)];
        var second: MatchInfo;

        for (let i = 0; i < currentMatches.length; i++) {
            if (currentMatches[i].id === first.id) continue;
            if (currentMatches[i].number === first.number) {
                second = currentMatches[i];
            }
        }

        const result = cpuPutCard(first.id);
        if (result === null) return;
        setTimeout(() => {
            cpuPutCard(second.id);
        }, cpuSecondMoveTimeout * 1000);
    }

    createEffect(() => {
        if (gameState().wonBy !== null) {
            clearInterval(cpuInterval());
        }
    });

    function randomizeArr<T>(arr: T[]): T[] {
        const temp = [...arr];

        for (let i = 0; i < temp.length; i++) {
            let randIndex = i;
            while (randIndex === i) {
                randIndex = Math.floor(Math.random() * temp.length);
            }

            const val = temp[randIndex];
            temp[randIndex] = temp[i];
            temp[i] = val;
        }

        return temp;
    }

    function resetTaggedPlacedCards(gameState: GameState) {
        const allCards = gameState.cardState
            .flat()
            .map((state) => state.side)
            .flat();
        for (let i = 0; i < allCards.length; i++) {
            allCards[i][allCards[i].length - 1].placedBy = "none";
        }
    }

    function startCpuLoop() {
        return setInterval(
            () => {
                cpuMakeMove();
            },
            cpuTimeout * 1000 + cpuSecondMoveTimeout * 1000,
        );
    }

    onMount(() => {
        const interval = startCpuLoop();
        setCpuInterval(interval);
        onCleanup(() => {
            clearInterval(interval);
        });
    });

    function restartGame() {
        setGameState(generateInitial(numDecks));
        startCpuLoop();
    }

    function handleSetDeckRef(ref: HTMLDivElement) {
        setTopDeckRef(ref);
    }

    return (
        <main class="flex justify-center items-center h-screen">
            {gameState().wonBy !== null ? (
                <div class="flex flex-col gap-4 items-center">
                    {gameState().wonBy === currentPlayerNum ? <h1>You Won!</h1> : <h1>You Lost</h1>}
                    <button
                        onClick={restartGame}
                        class="bg-neutral-200 px-8 py-4 rounded-xl cursor-pointer border-2 border-neutral-400 text-neutral-500 duration-150 hover:text-neutral-600 hover:border-neutral-500"
                    >
                        Restart
                    </button>
                </div>
            ) : (
                <>
                    <div class="flex flex-col gap-24">
                        <div class="flex gap-8">
                            {gameState().cardState[0].side.map((cards) => (
                                <CardPile
                                    cards={cards}
                                    width={cardWidth}
                                    onClick={(pos, id) => handleCardClick(0, id, pos)}
                                />
                            ))}
                        </div>
                        <div class="flex gap-8">
                            {gameState().cardState[1].side.map((cards) => (
                                <CardPile
                                    cards={cards}
                                    width={cardWidth}
                                    onClick={(pos, id) => handleCardClick(1, id, pos)}
                                />
                            ))}
                        </div>
                        <div class="w-full px-24">
                            <button
                                onClick={tryNewCards}
                                class="bg-neutral-200 px-8 py-4 rounded-xl cursor-pointer border-2 border-neutral-400 text-neutral-500 duration-150 hover:text-neutral-600 hover:border-neutral-500"
                            >
                                No Matches
                            </button>
                        </div>
                    </div>
                    <div class="absolute left-[50%] bottom-0 translate-x-[-50%] translate-y-[50%]">
                        <DeckGraphic
                            numCards={gameState().cardState[currentPlayerNum].hand.length}
                            width={cardWidth}
                            setDeckRef={handleSetDeckRef}
                        />
                    </div>
                    <div class="absolute left-4 bottom-4 text-5xl">
                        {gameState().cardState[currentPlayerNum].hand.length}
                    </div>
                    <div class="absolute top-4 right-4 text-5xl">
                        {gameState().cardState[oppPlayerNum].hand.length}
                    </div>
                    <Alerts alerts={alerts()} />
                    <FloatingCards instructions={floatInstructions()} cardWidth={cardWidth} />
                </>
            )}
        </main>
    );
}

export default App;
