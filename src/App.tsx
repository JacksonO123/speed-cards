import type {
    Card as CardType,
    GameState,
    MatchInfo,
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
import Card from "./components/Card";
import GrayButton from "./components/GrayButton";
import CircleButton from "./components/CircleButton";
import Add from "./icons/Add";
import Sub from "./icons/Sub";
import Popup from "./components/Popup";
import { useMatches } from "./hooks/useMatches";

type DeckMap = Map<string, number>;

type ChangeEvent = InputEvent & {
    currentTarget: HTMLInputElement;
    target: HTMLInputElement;
};

const NOT_PLACING = 0;

function App() {
    const cardWidth = 180;
    const minDecks = 1;
    const maxDecks = 100;
    const numPlayerCards = 4;
    const cpuTimeout = 1; // seconds
    const cpuSecondMoveTimeout = 1; // seconds

    const [numDecks, setNumDecks] = createSignal(minDecks);
    const [gameState, setGameState] = createSignal(generateInitial(numDecks()));
    const { allMatches, setCpuMatches, setPlayerMatches } = useMatches(getMatches());
    const [currentPlacing, setCurrentPlacing] = createSignal<number>(NOT_PLACING);

    const [cpuInterval, setCpuInterval] = createSignal(-1);
    const [topDeckRef, setTopDeckRef] = createSignal<HTMLDivElement | undefined>(undefined);

    const [alerts, addAlert] = useAlerts();
    const [floatInstructions, addFloatInstruction] = useFloatInstr();

    const [showingPopup, setShowingPopup] = createSignal(false);

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
        const topCards = [
            ...gameState().cardState.player.side,
            ...gameState().cardState.cpu.side,
        ].map((pile) => pile[pile.length - 1]);

        for (let i = 0; i < topCards.length; i++) {
            for (let j = 0; j < topCards.length; j++) {
                if (i === j) continue;

                if (topCards[i].number == topCards[j].number) {
                    if (!idSet.has(topCards[i].id)) {
                        matches.push({
                            number: topCards[j].number,
                            id: topCards[j].id,
                        });
                    }
                }
            }
        }

        return [...matches];
    }

    function handleCardClick(pileClickLocation: PileClickLocation, id: string, toPos: Point) {
        const deckRef = topDeckRef();
        if (!deckRef) return;

        const topCards = [
            ...gameState().cardState.player.side,
            ...gameState().cardState.cpu.side,
        ].map((pile) => pile[pile.length - 1]);
        const card = topCards.find((item) => item.id === id);
        if (!card) return;

        const isInMatches = allMatches().find((item) => item.id === id);

        if (
            currentPlacing() === NOT_PLACING ||
            !(isInMatches && currentPlacing() === card.number)
        ) {
            const newMatches = getMatches();
            setPlayerMatches(newMatches);
            setCurrentPlacing(card.number);
        }

        const includesCard = allMatches().find(
            (item) => item.number === card.number && item.id === card.id,
        );
        if (!includesCard) {
            const newMatches = getMatches();
            setPlayerMatches(newMatches);
            setCurrentPlacing(card.number);
            return;
        }

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

        const currentCpuMatches = allMatches();
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

        // check if any of the current cpu matches are on the
        // top cards, if they are keep them and make that move
        // otherwise find new matches
        setCpuMatches(getMatches());
        const currentMatches = randomizeArr(allMatches());
        if (currentMatches.length === 0) return;

        const first = currentMatches[Math.floor(Math.random() * currentMatches.length)];
        let pileLocation = getPileLocation(first.id)!;

        cpuPutCard(pileLocation, first.id);
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
                setTimeout(() => {
                    cpuMakeMove();
                }, cpuSecondMoveTimeout * 1000);
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
        clearInterval(cpuInterval());
        setGameState(generateInitial(numDecks()));
        setCpuInterval(startCpuLoop());
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

    function handleNumDecksChange(e: ChangeEvent) {
        let inputNum = e.currentTarget.valueAsNumber;
        inputNum = isNaN(inputNum) ? minDecks : inputNum;
        const newNum = Math.min(maxDecks, Math.max(minDecks, inputNum));
        setNumDecks(newNum);
    }

    function handleChangeDecks() {
        setShowingPopup(true);
    }

    function changeDecks() {
        restartGame();
        setShowingPopup(false);
    }

    const preloadCards: CardType[] = [
        { id: "", number: 11, suit: "clubs", placedBy: "none" },
        { id: "", number: 11, suit: "hearts", placedBy: "none" },
        { id: "", number: 11, suit: "diamonds", placedBy: "none" },
        { id: "", number: 11, suit: "spades", placedBy: "none" },

        { id: "", number: 12, suit: "clubs", placedBy: "none" },
        { id: "", number: 12, suit: "hearts", placedBy: "none" },
        { id: "", number: 12, suit: "diamonds", placedBy: "none" },
        { id: "", number: 12, suit: "spades", placedBy: "none" },

        { id: "", number: 13, suit: "clubs", placedBy: "none" },
        { id: "", number: 13, suit: "hearts", placedBy: "none" },
        { id: "", number: 13, suit: "diamonds", placedBy: "none" },
        { id: "", number: 13, suit: "spades", placedBy: "none" },
    ];

    return (
        <main class="flex justify-center items-center h-screen overflow-hidden">
            <div class="hidden" hidden>
                {preloadCards.map((card) => (
                    <Card card={card} width={cardWidth} />
                ))}
            </div>

            {gameState().wonBy !== null && (
                <Popup>
                    <div class="flex flex-col gap-4 items-center bg-transparent animate-backdrop justify-center h-full">
                        {gameState().wonBy === "player" ? <h1>You Won!</h1> : <h1>You Lost</h1>}
                        <GrayButton onClick={restartGame}>Restart</GrayButton>
                    </div>
                </Popup>
            )}

            {showingPopup() && (
                <Popup>
                    <div class="flex flex-col items-center bg-transparent animate-backdrop justify-center h-full">
                        <div class="max-w-96 flex flex-col gap-4">
                            <h1 class="text-center">
                                Changing the number of decks will restart the game, are you sure?
                            </h1>
                            <div class="flex gap-4 items-start">
                                <GrayButton onClick={changeDecks}>
                                    Yes, change the number of decks so that I can play this game
                                    with a new number of decks that I have just put in the thing and
                                    am ready to play it
                                </GrayButton>
                                <GrayButton class="whitespace-nowrap break-keep">
                                    No, dont to that
                                </GrayButton>
                            </div>
                        </div>
                    </div>
                </Popup>
            )}

            <div class="flex flex-col gap-12">
                <div class="flex flex-col gap-24 h-full justify-center items-center">
                    <div class="flex gap-8">{cpuCardEls()}</div>
                    <div class="flex gap-8">{playerCardEls()}</div>
                </div>
                <div class="h-20 flex justify-center gap-6 z-1000 items-start">
                    <div class="border-2 border-neutral-700 rounded-[20px] p-2 flex flex-col gap-2 bg-white mr-4">
                        <div class="flex gap-2 items-center">
                            <CircleButton
                                onClick={() => setNumDecks((prev) => Math.max(minDecks, prev - 1))}
                            >
                                <Sub />
                            </CircleButton>
                            <input
                                class="w-20 border-2 border-neutral-700 rounded-xl h-10 text-center text-xl font-semibold"
                                type="number"
                                value={numDecks()}
                                onInput={handleNumDecksChange}
                            />
                            <CircleButton
                                onClick={() => setNumDecks((prev) => Math.min(maxDecks, prev + 1))}
                            >
                                <Add />
                            </CircleButton>
                        </div>
                        <GrayButton onClick={handleChangeDecks}>Update</GrayButton>
                    </div>
                    <DeckGraphic
                        numCards={gameState().cardState.player.hand.length}
                        width={cardWidth}
                        setDeckRef={handleSetDeckRef}
                    />
                    <GrayButton class="px-8 py-4" onClick={tryNewCards}>
                        No Matches
                    </GrayButton>
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
        </main>
    );
}

export default App;
