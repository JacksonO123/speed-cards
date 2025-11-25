import { maxDecks, maxNumPlayerCards, minDecks, minNumPlayerCards } from "../constants/game";
import Add from "../icons/Add";
import Sub from "../icons/Sub";
import type { ChangeEvent } from "../types/types";
import CircleButton from "./CircleButton";
import LabelInput from "./LabelInput";

type DeckSettingsProps = {
    numPlayerCards: number;
    numDecks: number;
    updateNumDecks: (num: number) => void;
    updateNumPlayerCards: (num: number) => void;
};

export default function DeckSettings(props: DeckSettingsProps) {
    function handleSubDeck() {
        const newDecks = Math.max(minDecks, props.numDecks - 1);
        props.updateNumDecks(newDecks);
    }

    function handleAddDeck() {
        const newDecks = Math.min(maxDecks, props.numDecks + 1);
        props.updateNumDecks(newDecks);
    }

    function handleNumDecksChange(e: ChangeEvent) {
        let inputNum = e.currentTarget.valueAsNumber;
        inputNum = isNaN(inputNum) ? minDecks : inputNum;
        const newNum = Math.min(maxDecks, Math.max(minDecks, inputNum));
        props.updateNumDecks(newNum);
    }

    function handleSubPlayerCard() {
        const newNumCards = Math.max(minNumPlayerCards, props.numPlayerCards - 1);
        props.updateNumPlayerCards(newNumCards);
    }

    function handleAddPlayerCard() {
        const newNumCards = Math.min(maxNumPlayerCards, props.numPlayerCards + 1);
        props.updateNumPlayerCards(newNumCards);
    }

    function handleUpdateNumPlayerCards(e: ChangeEvent) {
        let numCards = e.currentTarget.valueAsNumber;
        numCards = isNaN(numCards) ? minNumPlayerCards : numCards;
        const newNum = Math.min(maxNumPlayerCards, Math.max(minNumPlayerCards, numCards));
        props.updateNumPlayerCards(newNum);
    }

    return (
        <div class="flex gap-4 items-center">
            <div class="flex gap-2 items-center">
                <CircleButton class="translate-y-2" onClick={handleSubDeck}>
                    <Sub />
                </CircleButton>
                <LabelInput
                    label="# Decks"
                    type="number"
                    value={props.numDecks}
                    onInput={handleNumDecksChange}
                />
                <CircleButton class="translate-y-2" onClick={handleAddDeck}>
                    <Add />
                </CircleButton>
            </div>
            <div class="w-0.5 rounded-full h-12 bg-neutral-700" />
            <div class="flex gap-2 items-center">
                <CircleButton class="translate-y-2" onClick={handleSubPlayerCard}>
                    <Sub />
                </CircleButton>
                <LabelInput
                    label="# Side Cards"
                    type="number"
                    value={props.numPlayerCards}
                    onInput={handleUpdateNumPlayerCards}
                />
                <CircleButton class="translate-y-2" onClick={handleAddPlayerCard}>
                    <Add />
                </CircleButton>
            </div>
        </div>
    );
}
