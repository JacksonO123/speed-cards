import { createSignal } from "solid-js";
import GrayButton from "./GrayButton";
import Popup from "./Popup";
import TimeoutSettings from "./TimeoutSettings";
import DeckSettings from "./DeckSettings";

type SettingsProps = {
    cpuTimeout: number;
    cpu2ndTimeout: number;
    numDecks: number;
    numPlayerCards: number;
    updateNumDecks: (num: number) => void;
    updateNumPlayerCards: (num: number) => void;
    restartGame: () => void;
    setCpuTimeout: (timeout: number) => void;
    setCpu2ndTimeout: (timeout: number) => void;
    setNewTimeoutValues: (timeout1: number, timeout2: number) => void;
};

type ShowingModes = "deck-settings" | "timeout-settings";

export default function Settings(props: SettingsProps) {
    const [showingPopup, setShowingPopup] = createSignal(false);
    const [newTimeoutValue, setNewTimeoutValue] = createSignal(props.cpuTimeout);
    const [new2ndTimeoutValue, setNew2ndTimeoutValue] = createSignal(props.cpu2ndTimeout);
    const [showing, setShowing] = createSignal<ShowingModes>("deck-settings");

    function handleUpdateGame() {
        setShowingPopup(true);
    }

    function updateGame() {
        props.setNewTimeoutValues(newTimeoutValue(), new2ndTimeoutValue());
        props.restartGame();
        setShowingPopup(false);
    }

    function toggleShowing() {
        setShowing((prev) => (prev === "deck-settings" ? "timeout-settings" : "deck-settings"));
    }

    return (
        <>
            {showingPopup() && (
                <Popup>
                    <div class="flex flex-col items-center bg-transparent animate-backdrop justify-center h-full">
                        <div class="max-w-96 flex flex-col gap-4">
                            <h1 class="text-center">
                                Changing the number of decks will restart the game, are you sure?
                            </h1>
                            <div class="flex gap-4 items-start">
                                <GrayButton onClick={updateGame}>
                                    Yes, change the number of decks so that I can play this game
                                    with a new number of decks that I have just put in the thing and
                                    am ready to play it
                                </GrayButton>
                                <GrayButton class="whitespace-nowrap break-keep">
                                    No, dont to that
                                </GrayButton>
                            </div>
                        </div>
                    </div>
                </Popup>
            )}

            <div class="border-2 border-neutral-700 rounded-[20px] p-2 flex flex-col justify-between bg-white mr-4 items-center gap-0.5">
                <div class="h-14 overflow-hidden">
                    <div
                        class="duration-150 flex flex-col gap-4"
                        style={{
                            transform:
                                showing() === "deck-settings"
                                    ? "translateY(0px)"
                                    : showing() === "timeout-settings"
                                      ? "translateY(-76px)"
                                      : undefined,
                        }}
                    >
                        <div class="h-14">
                            <TimeoutSettings
                                newTimeoutValue={newTimeoutValue()}
                                new2ndTimeoutValue={new2ndTimeoutValue()}
                                setNewTimeoutValue={setNewTimeoutValue}
                                setNew2ndTimeoutValue={setNew2ndTimeoutValue}
                            />
                        </div>
                        <div>
                            <DeckSettings
                                numPlayerCards={props.numPlayerCards}
                                numDecks={props.numDecks}
                                updateNumDecks={props.updateNumDecks}
                                updateNumPlayerCards={props.updateNumPlayerCards}
                            />
                        </div>
                    </div>
                </div>
                <button
                    class="w-fit flex gap-1 p-1.5 bg-neutral-100 rounded-full cursor-pointer duration-150 hover:bg-neutral-200"
                    onClick={toggleShowing}
                >
                    <div class="w-1 h-1 rounded-full bg-neutral-500" />
                    <div class="w-1 h-1 rounded-full bg-neutral-500" />
                    <div class="w-1 h-1 rounded-full bg-neutral-500" />
                </button>
                <GrayButton class="w-full mt-1.5" onClick={handleUpdateGame}>
                    Update
                </GrayButton>
            </div>
        </>
    );
}
