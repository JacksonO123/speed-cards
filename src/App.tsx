import { useState } from "react";
import "./App.css";
import Card from "./components/Card";

function App() {
    const [num, setNum] = useState(1);

    const add = () => {
        setNum((prev) => (prev === 13 ? 1 : prev + 1));
    };

    return (
        <main>
            <Card num={num} suit="spades" />
            <button
                onClick={() => add()}
                className="cursor-pointer border border-gray-200 px-2"
            >
                Add
            </button>
        </main>
    );
}

export default App;
