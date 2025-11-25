import type { ChangeEvent } from "../types/types";

type TimeoutSettingsProps = {
    newTimeoutValue: number;
    new2ndTimeoutValue: number;
    setNewTimeoutValue: (timeout: number) => void;
    setNew2ndTimeoutValue: (timeout: number) => void;
};

export default function TimeoutSettings(props: TimeoutSettingsProps) {
    const maxTimeoutOption = 8;

    function handleSetNewTimeoutValue(e: ChangeEvent) {
        let timeout = e.currentTarget.valueAsNumber;
        // nan timeout = get cooked
        timeout = isNaN(timeout) ? 0 : timeout;
        props.setNewTimeoutValue(timeout);
    }

    function handleSetNew2ndTimeoutValue(e: ChangeEvent) {
        let timeout = e.currentTarget.valueAsNumber;
        // nan timeout = get cooked
        timeout = isNaN(timeout) ? 0 : timeout;
        props.setNew2ndTimeoutValue(timeout);
    }

    return (
        <div class="flex flex-col">
            <div class="flex gap-2 items-center">
                <input
                    type="number"
                    class="border-2 border-neutral-700 text-center font-semibold p-0.5 w-10 text-xs h-6 rounded-lg"
                    value={props.newTimeoutValue}
                    onInput={handleSetNewTimeoutValue}
                />
                <div class="relative flex flex-col w-full">
                    <span class="font-semibold text-xs -mb-1">1st Timeout</span>
                    <input
                        type="range"
                        class="w-full"
                        step={0.25}
                        min={0}
                        max={maxTimeoutOption}
                        value={props.newTimeoutValue}
                        onInput={handleSetNewTimeoutValue}
                    />
                </div>
            </div>
            <div class="flex gap-2 items-center">
                <input
                    type="number"
                    class="border-2 border-neutral-700 text-center font-semibold p-0.5 w-10 text-xs h-6 rounded-lg"
                    value={props.new2ndTimeoutValue}
                    onInput={handleSetNew2ndTimeoutValue}
                />
                <div class="relative flex flex-col w-full">
                    <span class="font-semibold text-xs -mb-1">2nd Timeout</span>
                    <input
                        type="range"
                        class="w-full"
                        step={0.25}
                        min={0}
                        max={maxTimeoutOption}
                        value={props.new2ndTimeoutValue}
                        onInput={handleSetNew2ndTimeoutValue}
                    />
                </div>
            </div>
        </div>
    );
}
