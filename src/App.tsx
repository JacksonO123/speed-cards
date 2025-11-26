import type {
    Card as CardType,
    GameState,
    MatchInfo,
    PileClickLocation,
    Point,
    Suit,
} from "./types/types";
import {
    createEffect,
    createRoot,
    createSignal,
    onMount,
    untrack,
    type JSXElement,
} from "solid-js";
import Alerts from "./components/Alerts";
import { useAlerts } from "./hooks/useAlerts";
import CardPile from "./components/CardPile";
import { floatDuration, useFloatInstr } from "./hooks/useFloatInstr";
import FloatingCards from "./components/FloatingCards";
import "./App.css";
import Card from "./components/Card";
import GrayButton from "./components/GrayButton";
import Popup from "./components/Popup";
import { useMatches } from "./hooks/useMatches";
import Controls from "./components/Controls";
import { minDecks } from "./constants/game";
import backFace from "./assets/back-face.png";
import { useLocalStorage } from "./hooks/useLocalStorage";

type DeckMap = Map<string, number>;

const NOT_PLACING = 0;

function App() {
    const cardWidth = 180;

    const [started, setStarted] = createSignal(false);
    const [numPlayerCards, setNumPlayerCards] = useLocalStorage(4, "num-player-cards");
    const [cpuMoveTimeout, setCpuMoveTimeout] = useLocalStorage(1, "cpu-timeout");
    const [cpu2ndMoveTimeout, setCpu2ndMoveTimeout] = useLocalStorage(1, "cpu-2nd-timeout");
    const [numDecks, setNumDecks] = useLocalStorage(minDecks, "num-decks");
    const [gameState, setGameState] = createSignal(generateInitial(numDecks()));
    const { allMatches, setCpuMatches, setPlayerMatches } = useMatches(getMatches());
    const [currentPlacing, setCurrentPlacing] = createSignal<number>(NOT_PLACING);

    const [cpuTimeout, setCpuTimeout] = createSignal(-1);
    const [topDeckRef, setTopDeckRef] = createSignal<HTMLDivElement | undefined>(undefined);

    const [alerts, addAlert] = useAlerts();
    const [floatInstructions, addFloatInstruction] = useFloatInstr();

    let pileDispose: (() => void) | null = null;

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
            .splice(0, numPlayerCards())
            .map((card) => [card]);
        res.cardState.cpu.side = res.cardState.cpu.hand
            .splice(0, numPlayerCards())
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
        const topCards = getTopCards();

        for (let i = 0; i < topCards.length; i++) {
            for (let j = 0; j < topCards.length; j++) {
                if (i === j) continue;

                if (topCards[i].number == topCards[j].number) {
                    if (!idSet.has(topCards[j].id)) {
                        idSet.add(topCards[j].id);
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

    addEventListener("keydown", (e) => {
        if (e.key === "k") clearTimeout(cpuTimeout());
    });

    function handleCardClick(pileClickLocation: PileClickLocation, id: string, toPos: Point) {
        if (!started()) return;

        const deckRef = topDeckRef();
        if (!deckRef) {
            return;
        }

        const topCards = getTopCards();
        const card = topCards.find((item) => item.id === id);
        if (!card) {
            return;
        }

        const isInMatches = allMatches().find((item) => item.id === id);
        if (!isInMatches || currentPlacing() === NOT_PLACING || currentPlacing() !== card.number) {
            setPlayerMatches(getMatches());
        }

        setCurrentPlacing(card.number);

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
        const topCards = getTopCards();
        for (const match of currentCpuMatches) {
            if (topCards.find((item) => item.id === match.id)) {
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
        const player1TopN = player1Hand.splice(
            player1Hand.length - numPlayerCards(),
            numPlayerCards(),
        );
        currentGameState.cardState.player.side = player1TopN.map((card) => {
            card.placedBy = "none";
            return [card];
        });

        const player2Hand = currentGameState.cardState.cpu.hand;
        player2Hand.unshift(...currentGameState.cardState.cpu.side.flat());
        const player2TopN = player2Hand.splice(
            player2Hand.length - numPlayerCards(),
            numPlayerCards(),
        );
        currentGameState.cardState.cpu.side = player2TopN.map((card) => {
            card.placedBy = "none";
            return [card];
        });

        setGameState({ ...currentGameState });

        startCpuLoop();
    }

    /// return null if game won, true if card placed, false if not placed
    function cpuPutCard(pileLocation: PileClickLocation, cardId: string): boolean | null {
        const newGameState = gameState();
        const topCards = getTopCards();
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
        const topCards = getTopCards();
        for (let i = 0; i < topCards.length; i++) {
            if (topCards[i].id === cardId) {
                return {
                    side: i >= numPlayerCards() ? "player" : "cpu",
                    index: i % numPlayerCards(),
                };
            }
        }

        return null;
    }

    function getTopCards() {
        return [...gameState().cardState.cpu.side, ...gameState().cardState.player.side].map(
            (pile) => pile[pile.length - 1],
        );
    }

    function getMatchingSet(card: MatchInfo): MatchInfo[] {
        const res: MatchInfo[] = [];
        const topCards = getTopCards();

        for (let i = 0; i < topCards.length; i++) {
            if (topCards[i].number === card.number) {
                res.push(topCards[i]);
            }
        }

        return res;
    }

    function cpuMakeMove() {
        setCpuMatches(getMatches());
        const topCards = getTopCards().map((card) => card.id);
        const activeMatches = allMatches().filter((item) => topCards.includes(item.id));
        if (activeMatches.length === 0) {
            startCpuLoop();
            return;
        }
        const startCard = activeMatches[Math.floor(Math.random() * activeMatches.length)];
        const matchingSet = getMatchingSet(startCard);

        const card = matchingSet[0];
        cpuPutCard(getPileLocation(card.id)!, card.id);

        function attemptCard(index: number) {
            if (index >= matchingSet.length) {
                startCpuLoop();
                return;
            }

            const card = matchingSet[index];
            const pileLocation = getPileLocation(card.id);
            if (!pileLocation) {
                attemptCard(index + 1);
                return;
            }

            const res = cpuPutCard(pileLocation, card.id);
            if (res === null) return;
            if (!res) attemptCard(index + 1);

            const newIndex = index + 1;
            if (newIndex >= matchingSet.length) startCpuLoop();
            else {
                const timeout = setTimeout(() => {
                    attemptCard(index + 1);
                }, cpu2ndMoveTimeout() * 1000);
                setCpuTimeout(timeout);
            }
        }

        const timeout = setTimeout(() => {
            attemptCard(1);
        }, cpu2ndMoveTimeout() * 1000);
        setCpuTimeout(timeout);
    }

    function deferResetPlacedBy(card: CardType) {
        setTimeout(() => {
            card.placedBy = "none";
            setGameState({ ...gameState() });
        }, floatDuration * 1000);
    }

    function startCpuLoop() {
        clearTimeout(cpuTimeout());
        const timeout = setTimeout(() => {
            cpuMakeMove();
        }, cpuMoveTimeout() * 1000);
        setCpuTimeout(timeout);
    }

    function restartGame() {
        setStarted(false);
        clearTimeout(cpuTimeout());
        setGameState(generateInitial(numDecks()));
        pileDispose?.();
        setSideCardEls();
    }

    function handleSetDeckRef(ref: HTMLDivElement) {
        setTopDeckRef(ref);
    }

    const [cpuCardEls, setCpuCardEls] = createSignal<JSXElement[]>([]);
    const [playerCardEls, setPlayerCardEls] = createSignal<JSXElement[]>([]);

    function setSideCardEls() {
        createRoot((dispose) => {
            {
                const res: JSXElement[] = [];
                const len = gameState().cardState.cpu.side.length;
                for (let i = 0; i < len; i++) {
                    res.push(
                        <CardPile
                            cards={gameState().cardState.cpu.side[i]}
                            width={cardWidth}
                            onClick={(pos, id) =>
                                handleCardClick({ side: "cpu", index: i }, id, pos)
                            }
                            zBasis={(len - i - 1) * 1000}
                        />,
                    );
                }
                setCpuCardEls(res);
            }
            {
                const res: JSXElement[] = [];
                const len = gameState().cardState.player.side.length;
                for (let i = 0; i < len; i++) {
                    res.push(
                        <CardPile
                            cards={gameState().cardState.player.side[i]}
                            width={cardWidth}
                            onClick={(pos, id) =>
                                handleCardClick({ side: "player", index: i }, id, pos)
                            }
                            zBasis={
                                gameState().cardState.cpu.side.length * 1000 + (len - i - 1) * 1000
                            }
                        />,
                    );
                }
                setPlayerCardEls(res);
            }

            pileDispose = dispose;
        });
    }

    onMount(() => {
        setSideCardEls();
    });

    createEffect(() => {
        if (started()) {
            untrack(() => startCpuLoop());
        }
    });

    createEffect(() => {
        const timeout = cpuTimeout();
        if (gameState().wonBy !== null) {
            clearTimeout(timeout);
        }
    });

    function startOrTryNewCards() {
        if (started()) {
            tryNewCards();
        } else {
            setStarted(true);
        }
    }

    function handleSetNewTimeoutValues(first: number, second: number) {
        setCpuMoveTimeout(first);
        setCpu2ndMoveTimeout(second);
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
                <img src={backFace} />
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

            <div class="flex flex-col gap-12 h-full justify-between">
                <div class="flex flex-col gap-[6vh] h-full justify-center items-center">
                    <div class="flex gap-8">{cpuCardEls()}</div>
                    <div class="flex gap-8">{playerCardEls()}</div>
                </div>
                <Controls
                    gameState={gameState()}
                    started={started()}
                    cardWidth={cardWidth}
                    numDecks={numDecks()}
                    numPlayerCards={numPlayerCards()}
                    updateNumDecks={setNumDecks}
                    updateNumPlayerCards={setNumPlayerCards}
                    restartGame={restartGame}
                    setDeckRef={handleSetDeckRef}
                    startOrTryNewCards={startOrTryNewCards}
                    cpuTimeout={cpuMoveTimeout()}
                    cpu2ndTimeout={cpu2ndMoveTimeout()}
                    setCpuTimeout={setCpuMoveTimeout}
                    setCpu2ndTimeout={setCpu2ndMoveTimeout}
                    setNewTimeoutValues={handleSetNewTimeoutValues}
                />
                <div class="absolute left-4 bottom-4 text-5xl z-20000">
                    {gameState().cardState.player.hand.length}
                </div>
                <div class="absolute top-4 right-4 text-5xl z-20000">
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
