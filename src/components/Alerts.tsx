import { For } from "solid-js";
import type { AlertType } from "../types/types";
import { twMerge } from "tailwind-merge";
import "./Alerts.css";

type AlertsProps = {
    alerts: AlertType[];
};

export default function Alerts(props: AlertsProps) {
    const height = 58;

    return (
        <div class="absolute right-4 bottom-4 flex flex-col">
            <For each={props.alerts}>
                {(item) => (
                    <div
                        class={twMerge(
                            "duration-500 flex justify-center items-center",
                            !item.active && "shrink-height",
                        )}
                        style={{
                            height: item.active ? `${height}px` : undefined,
                            "margin-top": item.active ? "16px" : undefined,
                        }}
                    >
                        <div
                            class={twMerge(
                                "min-h-[58px] py-4 px-8 bg-red-400 rounded-lg text-white top-full break-keep text-nowrap right-0",
                                !item.active && "fade-out",
                            )}
                        >
                            {item.msg}
                        </div>
                    </div>
                )}
            </For>
        </div>
    );
}
