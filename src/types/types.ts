export type Suit = "clubs" | "hearts" | "diamonds" | "spades";

export type Card = {
    id: string;
    number: number;
    suit: Suit;
};

export type MatchInfo = {
    id: string;
    number: number;
};

export type PlayerState = {
    hand: Card[];
    side: Card[];
};

export type GameState = {
    wonBy: number | null;
    cardState: PlayerState[];
};
