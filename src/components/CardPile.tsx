import { For } from "solid-js";
import type { Card as CardType, Point } from "../types/types";
import Card from "./Card";
import { floatDuration } from "../hooks/useFloatInstr";
import { twMerge } from "tailwind-merge";

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
    const canBeClicked = () => props.index === props.numCards - 1;

    function handleClick(pos: Point) {
        if (canBeClicked()) {
            props.onClick(pos, props.card.id);
        }
    }

    return (
        <div
            style={{
                position: props.index === props.numCards - 1 ? "relative" : "absolute",
                "z-index": props.index === props.numCards - 1 ? 1000 : props.index,
                transition: `${floatDuration}s ease-in-out`,
                transform: `translate(${-16 * (props.numCards - 1 - props.index)}px, ${16 * (props.numCards - 1 - props.index)}px)`,
            }}
        >
            <Card
                class={twMerge(
                    props.index === props.numCards - 1 && props.card.placedBy === "player"
                        ? "opacity-0"
                        : "opacity-100",
                )}
                card={props.card}
                width={props.width}
                onClick={handleClick}
            />
        </div>
    );
}
