import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
    type Card as CardType,
    type GameState,
    type MatchInfo,
    type PlayerState,
    type Suit,
} from "./types/types";
import Card from "./components/Card";

type DeckMap = Map<string, number>;

const NOT_PLACING = 0;

function App() {
    const numPlayerCards = 4;
    const numDecks = 1;

    const initial = useMemo(() => generateInitial(numDecks), []);

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

        player1.side = player1.hand.splice(0, numPlayerCards);
        player2.side = player2.hand.splice(0, numPlayerCards);

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

    const [gameState, setGameState] = useState(initial);
    const [matches, setMatches] = useState<MatchInfo[]>([]);
    // 0 for nothing, card number if placed on that card last
    const [currentPlacing, setCurrentPlacing] = useState(NOT_PLACING);

    useEffect(() => {
        const firstMatches = getMatches();
        setMatches(firstMatches);
    }, []);

    function getMatches(): MatchInfo[] {
        const idSet = new Set<string>();
        const matches: MatchInfo[] = [];
        const allCards = gameState.cardState
            .map((player) => player.side)
            .flat();

        for (let i = 0; i < allCards.length; i++) {
            for (let j = 0; j < allCards.length; j++) {
                if (i === j) continue;

                if (allCards[i].number == allCards[j].number) {
                    if (!idSet.has(allCards[i].id)) {
                        matches.push({
                            number: allCards[i].number,
                            id: allCards[i].id,
                        });
                    }
                }
            }
        }

        return [...matches];
    }

    function handleCardClick(playerNum: number, index: number, id: string) {
        console.log(id);
        let currentMatches = matches;
        const card = gameState.cardState[playerNum].side[index];

        if (currentPlacing === NOT_PLACING || currentPlacing !== card.number) {
            const newMatches = getMatches();
            setMatches(newMatches);
            setCurrentPlacing(card.number);
            currentMatches = newMatches;
        }

        const includesCard = currentMatches.find(
            (item) => item.number === card.number && item.id === card.id,
        );
        if (!includesCard) return;

        setGameState((state) => {
            state.cardState[playerNum].hand = [
                ...state.cardState[playerNum].hand,
            ];
            console.log("here");
            const fromHand = state.cardState[playerNum].hand.pop();
            if (fromHand === undefined) return state;
            state.cardState[playerNum].side[index] = fromHand;
            state.cardState[playerNum].side = [
                ...state.cardState[playerNum].side,
            ];
            state.cardState = [...state.cardState];

            return { ...state };
        });
    }

    console.log(gameState.cardState[1].hand);

    return (
        <main className="flex justify-center items-center h-screen">
            {gameState.wonBy !== null ? (
                <h1>won by {gameState.wonBy}</h1>
            ) : (
                <>
                    <div className="flex flex-col gap-24">
                        <div className="flex gap-8">
                            {gameState.cardState[0].side.map((card, index) => (
                                <Card
                                    key={`player-1-card-${index}`}
                                    num={card.number}
                                    suit={card.suit}
                                    onClick={() =>
                                        handleCardClick(0, index, card.id)
                                    }
                                />
                            ))}
                        </div>
                        <div className="flex gap-8">
                            {gameState.cardState[1].side.map((card, index) => (
                                <Card
                                    key={`player-2-card-${index}`}
                                    num={card.number}
                                    suit={card.suit}
                                    onClick={() =>
                                        handleCardClick(1, index, card.id)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                    <div className="absolute left-0 bottom-0 text-5xl">
                        {gameState.cardState[1].hand.length}
                    </div>
                </>
            )}
        </main>
    );
}

export default App;
