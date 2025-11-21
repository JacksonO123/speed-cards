import { type JSX, splitProps } from "solid-js";
import { twMerge } from "tailwind-merge";

type LabelInputProps = {
    label: string;
} & JSX.InputHTMLAttributes<HTMLInputElement>;

export default function LabelInput(props: LabelInputProps) {
    const [classProp, otherProps] = splitProps(props, ["class"]);
    const inputId = crypto.randomUUID();

    return (
        <div class="flex flex-col">
            <label for={inputId} class="text-neutral-800 text-xs font-semibold">
                {props.label}
            </label>
            <input
                id={inputId}
                {...otherProps}
                class={twMerge(
                    "w-20 border-2 border-neutral-700 rounded-xl h-10 text-center text-xl font-semibold",
                    classProp.class,
                )}
            />
        </div>
    );
}
