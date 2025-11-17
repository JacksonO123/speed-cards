import {
    type Card as CardType,
    type GameState,
    type MatchInfo,
    type PlayerState,
    type Suit,
} from "./types/types";
import Card from "./components/Card";
import { createSignal } from "solid-js";
import Alerts from "./components/Alerts";
import { useAlerts } from "./hooks/useAlerts";

type DeckMap = Map<string, number>;

const NOT_PLACING = 0;

function App() {
    const numPlayerCards = 4;
    const numDecks = 1;
    const currentPlayerNum = 1;
    const oppPlayerNum = 0;

    const [gameState, setGameState] = createSignal(generateInitial(numDecks));
    const [matches, setMatches] = createSignal(getMatches());
    const [currentPlacing, setCurrentPlacing] = createSignal(NOT_PLACING);
    const [alerts, addAlert] = useAlerts();

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

        player1.side = player1.hand
            .splice(0, numPlayerCards)
            .map((card) => [card]);
        player2.side = player2.hand
            .splice(0, numPlayerCards)
            .map((card) => [card]);

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

    function handleCardClick(playerNum: number, id: string) {
        const cardStack = gameState().cardState[playerNum].side.find(
            (item) => item[item.length - 1].id === id,
        )!;
        const card = cardStack[cardStack.length - 1];

        if (
            currentPlacing() === NOT_PLACING ||
            currentPlacing() !== card.number
        ) {
            const newMatches = getMatches();
            setMatches(newMatches);
            setCurrentPlacing(card.number);
        }

        const includesCard = matches().find(
            (item) => item.number === card.number && item.id === card.id,
        );
        if (!includesCard) return;

        const newGameState = gameState();
        for (
            let i = 0;
            i < newGameState.cardState[playerNum].side.length;
            i++
        ) {
            const cardStack = newGameState.cardState[playerNum].side[i];
            if (cardStack[cardStack.length - 1].id === id) {
                const fromHand =
                    newGameState.cardState[currentPlayerNum].hand.pop()!;
                if (
                    newGameState.cardState[currentPlayerNum].hand.length === 0
                ) {
                    newGameState.wonBy = currentPlayerNum;
                    setGameState({ ...newGameState });
                    return;
                }
                newGameState.cardState[playerNum].side[i].push(fromHand);
            }
        }

        setGameState({ ...newGameState });
    }

    function tryNewCards() {
        const newMatches = getMatches();
        setMatches(newMatches);
        if (matches().length > 0) {
            addAlert("There are still matches");
            return;
        }

        const currentGameState = gameState();

        const player1Hand = currentGameState.cardState[currentPlayerNum].hand;
        const player1Top4 = player1Hand.splice(player1Hand.length - 4, 4);
        player1Hand.unshift(
            ...currentGameState.cardState[currentPlayerNum].side.flat(),
        );
        currentGameState.cardState[currentPlayerNum].side = player1Top4.map(
            (card) => [card],
        );

        const player2Hand = currentGameState.cardState[oppPlayerNum].hand;
        const player2Top4 = player2Hand.splice(player2Hand.length - 4, 4);
        player2Hand.unshift(
            ...currentGameState.cardState[oppPlayerNum].side.flat(),
        );
        currentGameState.cardState[oppPlayerNum].side = player2Top4.map(
            (card) => [card],
        );

        setGameState({ ...currentGameState });
    }

    return (
        <main class="flex justify-center items-center h-screen">
            {gameState().wonBy !== null ? (
                <h1>won by {gameState().wonBy}</h1>
            ) : (
                <>
                    <div class="flex flex-col gap-24">
                        <div class="flex gap-8">
                            {gameState().cardState[0].side.map((cards) => (
                                <Card
                                    num={cards[cards.length - 1].number}
                                    suit={cards[cards.length - 1].suit}
                                    width={120}
                                    onClick={() =>
                                        handleCardClick(
                                            0,
                                            cards[cards.length - 1].id,
                                        )
                                    }
                                />
                            ))}
                        </div>
                        <div class="flex gap-8">
                            {gameState().cardState[1].side.map((cards) => (
                                <Card
                                    num={cards[cards.length - 1].number}
                                    suit={cards[cards.length - 1].suit}
                                    width={120}
                                    onClick={() =>
                                        handleCardClick(
                                            1,
                                            cards[cards.length - 1].id,
                                        )
                                    }
                                />
                            ))}
                        </div>
                        <div class="flex justify-center">
                            <button
                                onClick={tryNewCards}
                                class="bg-neutral-200 px-8 py-4 rounded-xl cursor-pointer border-2 border-neutral-400 text-neutral-500 duration-150 hover:text-neutral-600 hover:border-neutral-500"
                            >
                                No Matches
                            </button>
                        </div>
                    </div>
                    <div class="absolute left-4 bottom-4 text-5xl">
                        {gameState().cardState[currentPlayerNum].hand.length}
                    </div>
                    <Alerts alerts={alerts()} />
                </>
            )}
        </main>
    );
}

export default App;
