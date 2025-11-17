import { For } from "solid-js";
import type { Card as CardType } from "../types/types";
import Card from "./Card";

type CardPileProps = {
    cards: CardType[];
    width: number;
    onClick: (id: string) => void;
};

export default function CardPile(props: CardPileProps) {
    return (
        <div class="relative">
            <For each={props.cards}>
                {(card, index) => (
                    <div
                        style={{
                            position:
                                index() === props.cards.length - 1
                                    ? "relative"
                                    : "absolute",
                            "z-index":
                                index() === props.cards.length - 1
                                    ? 1000
                                    : index(),
                            transform: `translate(${-16 * (props.cards.length - index() - 1)}px, ${16 * (props.cards.length - index() - 1)}px)`,
                        }}
                    >
                        <Card
                            {...card}
                            width={props.width}
                            onClick={() => props.onClick?.(card.id)}
                        />
                    </div>
                )}
            </For>
        </div>
    );
}
