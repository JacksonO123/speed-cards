import { type JSX, splitProps, mergeProps } from "solid-js";
import { twMerge } from "tailwind-merge";

type LabelInputProps = {
    label: string;
    labelPosition?: "top" | "bottom";
} & JSX.InputHTMLAttributes<HTMLInputElement>;

export default function LabelInput(props: LabelInputProps) {
    const merged = mergeProps({ labelPosition: "top" }, props);
    const [classProp, otherProps] = splitProps(merged, ["class"]);
    const inputId = crypto.randomUUID();

    const Label = () => (
        <label for={inputId} class="text-neutral-800 text-xs font-semibold">
            {props.label}
        </label>
    );

    return (
        <div class="flex flex-col">
            {otherProps.labelPosition === "top" && <Label />}
            <input
                id={inputId}
                {...otherProps}
                class={twMerge(
                    "w-20 border-2 border-neutral-700 rounded-xl h-10 text-center text-xl font-semibold",
                    classProp.class,
                )}
            />
            {otherProps.labelPosition === "bottom" && <Label />}
        </div>
    );
}
