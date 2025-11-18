import { createSignal, For, onMount } from "solid-js";
import type { FloatInstr } from "../types/types";
import Card from "./Card";
import { floatDuration } from "../hooks/useFloatInstr";

type FloatingCardsProps = {
    instructions: FloatInstr[];
    cardWidth: number;
};

export default function FloatingCards(props: FloatingCardsProps) {
    return (
        <>
            <For each={props.instructions}>
                {(item) => <Instruction instr={item} cardWidth={props.cardWidth} />}
            </For>
        </>
    );
}

function Instruction(props: { instr: FloatInstr; cardWidth: number }) {
    const [position, setPosition] = createSignal(props.instr.from);
    const [done, setDone] = createSignal(false);

    onMount(() => {
        setTimeout(() => {
            setPosition(props.instr.to);
        });

        setTimeout(() => {
            setDone(true);
        }, floatDuration * 1000);
    });

    return (
        <div
            class="absolute"
            style={{
                left: `${position().x}px`,
                top: `${position().y}px`,
                "z-index": 2000,
                transition: `${floatDuration}s`,
            }}
        >
            {done() ? null : <Card card={props.instr.card} width={props.cardWidth} />}
        </div>
    );
}
