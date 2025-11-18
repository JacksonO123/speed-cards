export type Suit = "clubs" | "hearts" | "diamonds" | "spades";

export type PlacedSources = "player" | "cpu" | "none";

export type Card = {
    id: string;
    number: number;
    suit: Suit;
    placedBy: PlacedSources;
};

export type MatchInfo = {
    id: string;
    number: number;
};

export type PlayerState = {
    hand: Card[];
    side: Card[][];
};

export type GameState = {
    wonBy: number | null;
    cardState: PlayerState[];
};

export type AlertType = {
    id: string;
    msg: string;
    active: boolean;
};
