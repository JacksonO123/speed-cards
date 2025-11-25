import { twMerge } from "tailwind-merge";
import DeckGraphic from "./DeckGraphic";
import GrayButton from "./GrayButton";
import type { GameState } from "../types/types";
import Settings from "./Settings";

type ControlsProps = {
    cpuTimeout: number;
    cpu2ndTimeout: number;
    gameState: GameState;
    started: boolean;
    cardWidth: number;
    numDecks: number;
    numPlayerCards: number;
    updateNumDecks: (num: number) => void;
    updateNumPlayerCards: (num: number) => void;
    restartGame: () => void;
    setDeckRef: (ref: HTMLDivElement) => void;
    startOrTryNewCards: () => void;
    setCpuTimeout: (timeout: number) => void;
    setCpu2ndTimeout: (timeout: number) => void;
    setNewTimeoutValues: (timeout1: number, timeout2: number) => void;
};

export default function Controls(props: ControlsProps) {
    return (
        <>
            <div class="flex justify-center gap-6 z-1000 items-start p-4">
                <Settings
                    cpuTimeout={props.cpuTimeout}
                    cpu2ndTimeout={props.cpu2ndTimeout}
                    numDecks={props.numDecks}
                    numPlayerCards={props.numPlayerCards}
                    updateNumPlayerCards={props.updateNumPlayerCards}
                    updateNumDecks={props.updateNumDecks}
                    restartGame={props.restartGame}
                    setCpuTimeout={props.setCpuTimeout}
                    setCpu2ndTimeout={props.setCpu2ndTimeout}
                    setNewTimeoutValues={props.setNewTimeoutValues}
                />
                <DeckGraphic
                    numCards={props.gameState.cardState.player.hand.length}
                    width={props.cardWidth}
                    setDeckRef={props.setDeckRef}
                />
                <GrayButton
                    class={twMerge(
                        "px-8 py-4",
                        !props.started &&
                            "bg-green-100 border-green-600 text-green-600 hover:bg-green-200",
                    )}
                    onClick={props.startOrTryNewCards}
                >
                    {props.started ? "No Matches" : "Start"}
                </GrayButton>
            </div>
        </>
    );
}
