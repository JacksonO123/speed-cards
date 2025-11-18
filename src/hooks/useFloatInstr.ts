import { createSignal } from "solid-js";
import type { FloatInstr } from "../types/types";

export const floatDuration = 0.5; // seconds

export function useFloatInstr() {
    const [floatInstructions, setFloatInstructions] = createSignal<FloatInstr[]>([]);

    function addFloatInstruction(instr: FloatInstr) {
        setFloatInstructions((prev) => [...prev, instr]);

        setTimeout(() => {
            setFloatInstructions((prev) => {
                for (let i = 0; i < prev.length; i++) {
                    if (prev[i].id === instr.id) {
                        prev.splice(i, 1);
                    }
                }
                return prev;
            });
        }, floatDuration * 1000);
    }

    return [floatInstructions, addFloatInstruction] as const;
}
