import clubsSrc from "../assets/clubs.png";
import heartsSrc from "../assets/heart.png";
import diamondsSrc from "../assets/diamonds.png";
import spadesSrc from "../assets/spades.svg";
import { twMerge } from "tailwind-merge";
import type { Suit } from "../types/types";

type CardProps = {
    num: number;
    suit: Suit;
    width?: number;
    className?: string;

    onClick?: () => void;
};

const defaultWidth = 225;

export default function Card({
    num,
    suit,
    width = defaultWidth,
    className,
    onClick,
}: CardProps) {
    const imgMap: Record<Suit, string> = {
        clubs: clubsSrc,
        hearts: heartsSrc,
        diamonds: diamondsSrc,
        spades: spadesSrc,
    };

    const widthToHeightRatio = 300 / 225;
    const height = widthToHeightRatio * width;

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

    const NumComp = () => <span class="w-fit">{formatNum(num)}</span>;

    const SuitComp = ({
        maxSize,
        className,
    }: {
        maxSize?: number;
        className?: string;
    }) => (
        <img
            src={imgMap[suit]}
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
                num === 7 && "pb-[2.5em]",
                num === 10
                    ? "justify-evenly"
                    : num > 1 && num <= 3
                      ? "justify-between"
                      : "justify-center",
            )}
        >
            {num <= 3 ? (
                Array(num)
                    .fill(null)
                    .map(() => <SuitComp />)
            ) : num % 2 !== 0 ? (
                <SuitComp />
            ) : num === 10 ? (
                <>
                    <SuitComp />
                    <div></div>
                    <SuitComp className="rotate-180" />
                </>
            ) : null}
        </div>
    );

    const SideCol = () => {
        const length = num > 3 ? Math.min(Math.floor(num / 2), 4) : 0;

        return (
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
        );
    };

    return (
        <div
            class={twMerge(
                "border-2 border-gray-300 w-[225px] h-[300px] rounded-lg flex justify-between px-[1.3em] gap-1 cursor-pointer select-none shadow-xs relative",
                className,
            )}
            onClick={() => onClick?.()}
            style={{
                width: `${width}px`,
                "min-width": `${width}px`,
                "max-width": `${width}px`,
                height: `${height}px`,
                "min-height": `${height}px`,
                "max-height": `${height}px`,
                "font-size": `${width / 100}em`,
            }}
        >
            <div class="h-full flex flex-col pl-2 absolute left-0 top-0">
                <NumComp />
                <SuitComp className="w-[0.75em]" />
            </div>
            <div class="w-full flex">
                <SideCol />
                <MiddleCol />
                <SideCol />
            </div>
            <div class="h-full flex flex-col items-end justify-end pr-2 absolute right-0 bottom-0">
                <SuitComp className="w-[0.75em]" />
                <NumComp />
            </div>
        </div>
    );
}
