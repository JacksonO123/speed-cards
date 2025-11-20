import { type JSX, splitProps } from "solid-js";
import { twMerge } from "tailwind-merge";

export default function GrayButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
    const [classProp, otherProps] = splitProps(props, ["class"]);

    return (
        <button
            {...otherProps}
            class={twMerge(
                "bg-neutral-100 px-4 py-2 rounded-xl cursor-pointer border-2 border-neutral-700 text-neutral-700 duration-150 hover:bg-neutral-200",
                classProp.class,
            )}
        />
    );
}
