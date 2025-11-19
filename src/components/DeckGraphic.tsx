import { twMerge } from "tailwind-merge";
import backFace from "../assets/back-face.png";

type DeckGraphicProps = {
    numCards: number;
    width: number;
    setDeckRef: (el: HTMLDivElement) => void;
};

export default function DeckGraphic(props: DeckGraphicProps) {
    const Img = (imgProps: { index: number; abs?: boolean }) => (
        <img
            src={backFace}
            draggable={false}
            class={twMerge("select-none", imgProps.abs ? "absolute top-0 left-0" : "relative")}
            style={{
                width: `${props.width}px`,
                "z-index": 3 - imgProps.index,
                transform: `translate(${-8 * imgProps.index}px, ${8 * imgProps.index}px)`,
            }}
        />
    );

    return (
        <div class="relative" ref={(el) => props.setDeckRef(el)}>
            {props.numCards > 0 && <Img index={0} />}
            {props.numCards > 1 && <Img abs index={1} />}
            {props.numCards > 2 && <Img abs index={2} />}
        </div>
    );
}
