import { createSignal } from "solid-js";
import type { MatchInfo } from "../types/types";

export function useMatches(defaultMatches: MatchInfo[]) {
    const [cpuMatches, setCpuMatches] = createSignal(defaultMatches);
    const [playerMatches, setPlayerMatches] = createSignal(defaultMatches);

    function allMatches() {
        return [...cpuMatches(), ...playerMatches()];
    }

    return { allMatches, setCpuMatches, setPlayerMatches } as const;
}
