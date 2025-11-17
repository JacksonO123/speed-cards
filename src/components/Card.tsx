import clubsSrc from "../assets/clubs.png";
import heartsSrc from "../assets/heart.png";
import diamondsSrc from "../assets/diamonds.png";
import spadesSrc from "../assets/spades.svg";

import jackClubsSrc from "../assets/jack-faces/jack-clubs.jpg";
import jackHeartsSrc from "../assets/jack-faces/jack-hearts.jpg";
import jackDiamondsSrc from "../assets/jack-faces/jack-diamonds.jpg";
import jackSpadesSrc from "../assets/jack-faces/jack-spades.jpg";

import queenClubsSrc from "../assets/queen-faces/queen-clubs.jpg";
import queenHeartsSrc from "../assets/queen-faces/queen-hearts.jpg";
import queenDiamondsSrc from "../assets/queen-faces/queen-diamonds.jpg";
import queenSpadesSrc from "../assets/queen-faces/queen-spades.jpg";

import kingClubsSrc from "../assets/king-faces/king-clubs.jpg";
import kingHeartsSrc from "../assets/king-faces/king-hearts.jpg";
import kingDiamondsSrc from "../assets/king-faces/king-diamonds.jpg";
import kingSpadesSrc from "../assets/king-faces/king-spades.jpg";

import { twMerge } from "tailwind-merge";
import type { Suit } from "../types/types";

type CardProps = {
    num: number;
    suit: Suit;
    width?: number;
    className?: string;

    onClick?: () => void;
};

type FaceNumbers = 11 | 12 | 13;

type SuitInfo = {
    clubs: string;
    hearts: string;
    diamonds: string;
    spades: string;
};

type CardSrcData<T> = T extends Suit ? string : SuitInfo;

const defaultWidth = 225;

export default function Card(props: CardProps) {
    props.width = props.width ?? defaultWidth;
    const imgMap: Record<
        Suit | FaceNumbers,
        CardSrcData<Suit | FaceNumbers>
    > = {
        clubs: clubsSrc,
        hearts: heartsSrc,
        diamonds: diamondsSrc,
        spades: spadesSrc,
        11: {
            clubs: jackClubsSrc,
            hearts: jackHeartsSrc,
            diamonds: jackDiamondsSrc,
            spades: jackSpadesSrc,
        },
        12: {
            clubs: queenClubsSrc,
            hearts: queenHeartsSrc,
            diamonds: queenDiamondsSrc,
            spades: queenSpadesSrc,
        },
        13: {
            clubs: kingClubsSrc,
            hearts: kingHeartsSrc,
            diamonds: kingDiamondsSrc,
            spades: kingSpadesSrc,
        },
    };

    const widthToHeightRatio = 300 / 225;
    const height = widthToHeightRatio * props.width;

    const formatNum = (num: number) => {
        switch (num) {
            case 1:
                return "A";
            case 11:
                return "J";
            case 12:
                return "Q";
            case 13:
                return "K";
            default:
                return num;
        }
    };

    const NumComp = () => <span class="w-fit">{formatNum(props.num)}</span>;

    const SuitComp = ({
        maxSize,
        className,
    }: {
        maxSize?: number;
        className?: string;
    }) => (
        <img
            src={imgMap[props.suit] as string}
            class={twMerge(className, "max-w-full")}
            style={{
                ...(maxSize
                    ? {
                          width: `${maxSize}px`,
                          "min-width": `${maxSize}px`,
                          "max-width": `${maxSize}px`,
                      }
                    : {}),
                height: "auto",
            }}
        />
    );

    const MiddleCol = () => (
        <div
            class={twMerge(
                "w-full flex flex-col justify-between items-center my-[0.6em]",
                props.num === 7 && "pb-[2.75em]",
                props.num === 10
                    ? "justify-evenly"
                    : props.num > 1 && props.num <= 3
                      ? "justify-between"
                      : "justify-center",
            )}
        >
            {props.num > 10 ? (
                <img
                    src={
                        (imgMap[props.num as FaceNumbers] as SuitInfo)[
                            props.suit
                        ]
                    }
                    class="border-2 border-sky-700"
                />
            ) : props.num <= 3 ? (
                Array(props.num)
                    .fill(null)
                    .map(() => <SuitComp />)
            ) : props.num % 2 !== 0 ? (
                <SuitComp />
            ) : props.num === 10 ? (
                <>
                    <SuitComp />
                    <div></div>
                    <SuitComp className="rotate-180" />
                </>
            ) : null}
        </div>
    );

    const SideCol = () => {
        const length =
            props.num > 3 ? Math.min(Math.floor(props.num / 2), 4) : 0;

        return props.num <= 10 ? (
            <div
                class={twMerge(
                    "w-full flex flex-col justify-between items-center my-[0.6em]",
                    length > 1 ? "justify-between" : "justify-center",
                )}
            >
                {Array(length)
                    .fill(null)
                    .map((_, index) => (
                        <SuitComp
                            className={
                                index >= length / 2 ? "rotate-180" : undefined
                            }
                        />
                    ))}
            </div>
        ) : null;
    };

    return (
        <div
            class={twMerge(
                "border-2 border-gray-300 w-[225px] h-[300px] rounded-lg flex justify-between px-[1.35em] gap-1 cursor-pointer select-none shadow-xs relative",
                props.className,
            )}
            onClick={() => props.onClick?.()}
            style={{
                width: `${props.width}px`,
                "min-width": `${props.width}px`,
                "max-width": `${props.width}px`,
                height: `${height}px`,
                "min-height": `${height}px`,
                "max-height": `${height}px`,
                "font-size": `${props.width / 110}em`,
            }}
        >
            <div class="h-full flex flex-col items-center pl-[0.25em] absolute left-0 top-0">
                <NumComp />
                <SuitComp className="w-[0.75em]" />
            </div>
            <div class="w-full flex">
                <SideCol />
                <MiddleCol />
                <SideCol />
            </div>
            <div class="h-full flex flex-col items-center justify-end pr-[0.25em] absolute right-0 bottom-0">
                <SuitComp className="w-[0.75em]" />
                <NumComp />
            </div>
        </div>
    );
}
