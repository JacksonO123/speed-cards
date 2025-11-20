import { type JSX, splitProps } from "solid-js";
import { twMerge } from "tailwind-merge";

export default function CircleButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
    const [classProp, otherProps] = splitProps(props, ["class"]);

    return (
        <button
            {...otherProps}
            class={twMerge(
                "w-8 h-8 bg-neutral-100 rounded-full text-xl flex justify-center items-center cursor-pointer duration-150 hover:bg-neutral-200",
                classProp.class,
            )}
        />
    );
}
