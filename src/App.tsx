import type {
    Card as CardType,
    GameState,
    MatchInfo,
    MatchLocationInfo,
    PileClickLocation,
    Point,
    Suit,
} from "./types/types";
import { createEffect, createSignal, onCleanup, onMount, type JSXElement } from "solid-js";
import Alerts from "./components/Alerts";
import { useAlerts } from "./hooks/useAlerts";
import CardPile from "./components/CardPile";
import DeckGraphic from "./components/DeckGraphic";
import { floatDuration, useFloatInstr } from "./hooks/useFloatInstr";
import FloatingCards from "./components/FloatingCards";
import "./App.css";

type DeckMap = Map<string, number>;

const NOT_PLACING = 0;

function App() {
    const cardWidth = 180;
    const numPlayerCards = 4;
    const numDecks = 1;
    const cpuTimeout = 4; // seconds
    const cpuSecondMoveTimeout = 0.5; // seconds

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
        const res: GameState = {
            wonBy: null,
            cardState: {
                player: {
                    side: [],
                    hand: [],
                },
                cpu: {
                    side: [],
                    hand: [],
                },
            },
        };

        const deckMap: DeckMap = newDeckMap(numDecks);

        for (let i = 0; i < (52 * numDecks) / 2; i++) {
            const playerCard = randomCard(deckMap);
            res.cardState.player.hand.push(playerCard);

            const cpuCard = randomCard(deckMap);
            res.cardState.cpu.hand.push(cpuCard);
        }

        res.cardState.player.side = res.cardState.player.hand
            .splice(0, numPlayerCards)
            .map((card) => [card]);
        res.cardState.cpu.side = res.cardState.cpu.hand
            .splice(0, numPlayerCards)
            .map((card) => [card]);

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
        const allCards = [...gameState().cardState.player.side, ...gameState().cardState.cpu.side];

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

    function handleCardClick(pileClickLocation: PileClickLocation, id: string, toPos: Point) {
        console.log("clicking");
        const deckRef = topDeckRef();
        if (!deckRef || currentPlacing().id === id) return;

        const allPiles = [...gameState().cardState.player.side, ...gameState().cardState.cpu.side];
        const cardStack = allPiles.find((item) => item[item.length - 1].id === id);
        if (!cardStack) return;
        const card = cardStack[cardStack.length - 1];
        console.log({ suit: card.suit, number: card.number });

        let allMatches = [...playerMatches(), ...cpuMatches()];

        if (currentPlacing().number === NOT_PLACING || !allMatches.find((item) => item.id === id)) {
            const newMatches = getMatches();
            setPlayerMatches(newMatches);
            setCurrentPlacing((prev) => {
                prev.number = card.number;
                return { ...prev };
            });
            allMatches = [...playerMatches(), ...cpuMatches()];
        }

        const includesCard = allMatches.find(
            (item) => item.number === card.number && item.id === card.id,
        );
        if (!includesCard) {
            const newMatches = getMatches();
            setPlayerMatches(newMatches);
            setCurrentPlacing((prev) => {
                prev.number = card.number;
                return { ...prev };
            });
            return;
        }

        const topCards = allPiles.map((pile) => pile[pile.length - 1]);
        const newGameState = gameState();
        for (let i = 0; i < topCards.length; i++) {
            if (topCards[i].id === id) {
                const fromHand = newGameState.cardState.player.hand.pop()!;
                fromHand.placedBy = "player";
                deferResetPlacedBy(fromHand);
                newGameState.cardState[pileClickLocation.side].side[pileClickLocation.index].push(
                    fromHand,
                );

                const rect = deckRef.getBoundingClientRect();
                const from: Point = { x: rect.x, y: rect.y };
                addFloatInstruction({
                    id: crypto.randomUUID(),
                    from,
                    to: toPos,
                    card: fromHand,
                });

                if (newGameState.cardState.player.hand.length === 0) {
                    newGameState.wonBy = "player";
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
        const allCards = [
            ...gameState().cardState.player.side,
            ...gameState().cardState.cpu.side,
        ].map((pile) => pile[pile.length - 1]);
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

        const player1Hand = currentGameState.cardState.player.hand;
        player1Hand.unshift(...currentGameState.cardState.player.side.flat());
        const player1Top4 = player1Hand.splice(player1Hand.length - 4, 4);
        currentGameState.cardState.player.side = player1Top4.map((card) => {
            card.placedBy = "none";
            return [card];
        });

        const player2Hand = currentGameState.cardState.cpu.hand;
        player2Hand.unshift(...currentGameState.cardState.cpu.side.flat());
        const player2Top4 = player2Hand.splice(player2Hand.length - 4, 4);
        currentGameState.cardState.cpu.side = player2Top4.map((card) => {
            card.placedBy = "none";
            return [card];
        });

        setGameState({ ...currentGameState });
    }

    /// return null if game won, true if card placed, false if not placed
    function cpuPutCard(pileLocation: PileClickLocation, cardId: string): boolean | null {
        const newGameState = gameState();
        const topCards = [
            ...newGameState.cardState.player.side,
            ...newGameState.cardState.cpu.side,
        ].map((pile) => pile[pile.length - 1]);
        for (let i = 0; i < topCards.length; i++) {
            if (topCards[i].id === cardId) {
                const hand = newGameState.cardState.cpu.hand;
                const handCard = hand.pop()!;
                handCard.placedBy = "cpu";
                deferResetPlacedBy(handCard);
                newGameState.cardState[pileLocation.side].side[pileLocation.index].push(handCard);

                if (hand.length === 0) {
                    newGameState.wonBy = "cpu";
                    setGameState({ ...newGameState });
                    return null;
                }

                setGameState({ ...newGameState });
                return true;
            }
        }

        return false;
    }

    function getMatchTo(info: MatchInfo, matches: MatchInfo[]): MatchLocationInfo | null {
        for (let i = 0; i < matches.length; i++) {
            if (matches[i].id === info.id) continue;
            if (matches[i].number === info.number) return { match: matches[i], index: i };
        }

        return null;
    }

    function getPileLocation(cardId: string): PileClickLocation | null {
        const topCards = [
            ...gameState().cardState.cpu.side,
            ...gameState().cardState.player.side,
        ].map((pile) => pile[pile.length - 1]);
        for (let i = 0; i < topCards.length; i++) {
            if (topCards[i].id === cardId) {
                return {
                    side: i > 3 ? "player" : "cpu",
                    index: i % 4,
                };
            }
        }

        return null;
    }

    function cpuMakeMove() {
        console.log("making move");

        setCpuMatches([...getMatches(), ...playerMatches()]);
        const currentMatches = randomizeArr(cpuMatches());
        if (currentMatches.length === 0) return;

        const first = currentMatches[Math.floor(Math.random() * currentMatches.length)];
        let pileLocation = getPileLocation(first.id)!;
        var second: MatchLocationInfo;

        for (let i = 0; i < currentMatches.length; i++) {
            if (currentMatches[i].id === first.id) continue;
            if (currentMatches[i].number === first.number) {
                second = { match: currentMatches[i], index: i };
            }
        }

        // @ts-ignore
        const result = cpuPutCard(pileLocation, first.id);
        if (result === null) return;
        setTimeout(() => {
            let matchIndex = second.index;
            pileLocation = getPileLocation(second.match.id)!;
            let placed = cpuPutCard(pileLocation, second.match.id);
            while (!placed) {
                currentMatches.splice(matchIndex, 1);
                const newMatch = getMatchTo(first, currentMatches);
                if (!newMatch) break;
                matchIndex = newMatch.index;
                const tempPileLocation = getPileLocation(newMatch.match.id)!;
                placed = cpuPutCard(tempPileLocation, newMatch.match.id);
            }
        }, cpuSecondMoveTimeout * 1000);
    }

    createEffect(() => {
        const interval = cpuInterval();
        if (gameState().wonBy !== null) {
            clearInterval(interval);
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

    function deferResetPlacedBy(card: CardType) {
        setTimeout(() => {
            card.placedBy = "none";
            setGameState({ ...gameState() });
        }, floatDuration * 1000);
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

    const [cpuCardEls, setCpuCardEls] = createSignal<JSXElement[]>([]);
    const [playerCardEls, setPlayerCardEls] = createSignal<JSXElement[]>([]);

    onMount(() => {
        {
            const res: JSXElement[] = [];
            for (let i = 0; i < gameState().cardState.cpu.side.length; i++) {
                res.push(
                    <CardPile
                        cards={gameState().cardState.cpu.side[i]}
                        width={cardWidth}
                        onClick={(pos, id) => handleCardClick({ side: "cpu", index: i }, id, pos)}
                    />,
                );
            }
            setCpuCardEls(res);
        }
        {
            const res: JSXElement[] = [];
            for (let i = 0; i < gameState().cardState.player.side.length; i++) {
                res.push(
                    <CardPile
                        cards={gameState().cardState.player.side[i]}
                        width={cardWidth}
                        onClick={(pos, id) =>
                            handleCardClick({ side: "player", index: i }, id, pos)
                        }
                    />,
                );
            }
            setPlayerCardEls(res);
        }
    });

    return (
        <main class="flex justify-center items-center h-screen overflow-hidden">
            {gameState().wonBy !== null && (
                <div class="flex flex-col gap-4 items-center absolute top-0 left-0 bottom-0 right-0 bg-transparent animate-backdrop z-3000 justify-center">
                    {gameState().wonBy === "player" ? <h1>You Won!</h1> : <h1>You Lost</h1>}
                    <button
                        onClick={restartGame}
                        class="bg-neutral-200 px-8 py-4 rounded-xl cursor-pointer border-2 border-neutral-400 text-neutral-500 duration-150 hover:text-neutral-600 hover:border-neutral-500"
                    >
                        Restart
                    </button>
                </div>
            )}
            {
                <div class="flex flex-col gap-12">
                    <div class="flex flex-col gap-24 h-full justify-center items-center">
                        <div class="flex gap-8">{cpuCardEls()}</div>
                        <div class="flex gap-8">{playerCardEls()}</div>
                    </div>
                    <div class="h-20 flex justify-center gap-6 z-1000">
                        <DeckGraphic
                            numCards={gameState().cardState.player.hand.length}
                            width={cardWidth}
                            setDeckRef={handleSetDeckRef}
                        />
                        <button
                            onClick={tryNewCards}
                            class="bg-neutral-200 px-8 py-4 rounded-xl cursor-pointer border-2 border-neutral-400 text-neutral-500 duration-150 hover:text-neutral-600 hover:border-neutral-500"
                        >
                            No Matches
                        </button>
                    </div>
                    <div class="absolute left-4 bottom-4 text-5xl">
                        {gameState().cardState.player.hand.length}
                    </div>
                    <div class="absolute top-4 right-4 text-5xl">
                        {gameState().cardState.cpu.hand.length}
                    </div>
                    <div class="absolute right-3 bottom-2">By Jackson Otto</div>
                    <Alerts alerts={alerts()} />
                    <FloatingCards instructions={floatInstructions()} cardWidth={cardWidth} />
                </div>
            }
        </main>
    );
}

export default App;
