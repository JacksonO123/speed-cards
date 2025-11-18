import { createEffect, createSignal, For } from "solid-js";
import type { Card as CardType, Point } from "../types/types";
import Card from "./Card";
import { floatDuration } from "../hooks/useFloatInstr";

type CardPileProps = {
    cards: CardType[];
    width: number;
    onClick: (pos: Point, id: string) => void;
};

export default function CardPile(props: CardPileProps) {
    return (
        <div class="relative">
            <For each={props.cards}>
                {(card, index) => (
                    <PileCard
                        card={card}
                        index={index()}
                        width={props.width}
                        onClick={props.onClick}
                        numCards={props.cards.length}
                    />
                )}
            </For>
        </div>
    );
}

type PileCardProps = {
    index: number;
    card: CardType;
    numCards: number;
    width: number;
    onClick: (pos: Point, id: string) => void;
};

function PileCard(props: PileCardProps) {
    const [offset, setOffset] = createSignal<Point>({ x: 0, y: 0 });

    function getOffset(index: number): Point {
        return {
            x: -16 * (props.numCards - 1 - index),
            y: 16 * (props.numCards - 1 - index),
        };
    }

    createEffect(() => {
        setOffset(getOffset(props.index));
    });

    createEffect(() => {
        console.log(offset());
    });

    return (
        <div
            style={{
                position: props.index === props.numCards - 1 ? "relative" : "absolute",
                "z-index": props.index === props.numCards - 1 ? 1000 : props.index,
                transform: `translate(${offset().x}px, ${offset().y}px)`,
            }}
        >
            <Card
                card={props.card}
                width={props.width}
                onClick={(pos) => props.onClick(pos, props.card.id)}
            />
        </div>
    );
}
