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

export type CardState = {
    player: PlayerState;
    cpu: PlayerState;
};

export type GameState = {
    wonBy: "player" | "cpu" | null;
    cardState: CardState;
};

export type AlertType = {
    id: string;
    msg: string;
    active: boolean;
};

export type Point = {
    x: number;
    y: number;
};

export type FloatInstr = {
    id: string;
    from: Point;
    to: Point;
    card: Card;
};

export type MatchLocationInfo = {
    match: MatchInfo;
    index: number;
};

export type PileClickLocation = {
    side: keyof CardState;
    index: number;
};
