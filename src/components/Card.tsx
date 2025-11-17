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

    onClick?: () => void;
};

const defaultWidth = 225;

export default function Card({
    num,
    suit,
    width = defaultWidth,
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

    const NumComp = () => <span className="text-3xl">{formatNum(num)}</span>;

    const SuitComp = ({
        size,
        className,
    }: {
        size: number;
        className?: string;
    }) => (
        <img
            src={imgMap[suit]}
            className={className}
            style={{
                width: `${size}px`,
                minWidth: `${size}px`,
                maxWidth: `${size}px`,
                height: "auto",
            }}
        />
    );

    const MiddleCol = () => (
        <div
            className={twMerge(
                "w-full flex flex-col justify-between items-center my-4",
                num === 7 && "pb-24",
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
                    .map((_, index) => <SuitComp key={index} size={40} />)
            ) : num % 2 !== 0 ? (
                <SuitComp size={40} />
            ) : num === 10 ? (
                <>
                    <SuitComp size={40} />
                    <div></div>
                    <SuitComp size={40} className="rotate-180" />
                </>
            ) : null}
        </div>
    );

    const SideCol = () => {
        const length = num > 3 ? Math.min(Math.floor(num / 2), 4) : 0;

        return (
            <div
                className={twMerge(
                    "w-full flex flex-col justify-between items-center",
                    "my-4",
                    length > 1 ? "justify-between" : "justify-center",
                )}
            >
                {Array(length)
                    .fill(null)
                    .map((_, index) => (
                        <SuitComp
                            key={index}
                            size={40}
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
            className="border-2 border-gray-300 w-[225px] h-[300px] rounded-lg flex justify-between p-1 gap-1 cursor-pointer select-none shadow-xs"
            onClick={() => onClick?.()}
            style={{
                width: `${width}px`,
                minWidth: `${width}px`,
                maxWidth: `${width}px`,
                height: `${height}px`,
                minHeight: `${height}px`,
                maxHeight: `${height}px`,
            }}
        >
            <div className="h-full flex flex-col pl-2 w-10 min-w-10 max-w-10">
                <NumComp />
                <SuitComp size={20} />
            </div>
            <div className="w-full flex">
                <SideCol />
                <MiddleCol />
                <SideCol />
            </div>
            <div className="h-full flex flex-col items-end justify-end pr-2 w-10 min-w-10 max-w-10">
                <SuitComp size={20} />
                <NumComp />
            </div>
        </div>
    );
}
