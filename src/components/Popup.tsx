import { Portal } from "solid-js/web";
import type { JSXElement } from "solid-js";

type WinPopupProps = {
    children: JSXElement;
};

export default function WinPopup(props: WinPopupProps) {
    return (
        <Portal mount={document.querySelector("main")!}>
            <div class="absolute top-0 left-0 bottom-0 right-0 z-3000">{props.children}</div>
        </Portal>
    );
}
