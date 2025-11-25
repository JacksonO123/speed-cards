import { createSignal } from "solid-js";

export function useLocalStorage<T>(defaultValue: T, key: string) {
    const fromLocalStorage = localStorage.getItem(key);
    const initial = fromLocalStorage !== null ? (JSON.parse(fromLocalStorage) as T) : defaultValue;
    const [value, setValue] = createSignal(initial);

    function setLocalStorageValue(newValue: T) {
        const str = JSON.stringify(newValue);
        localStorage.setItem(key, str);
        setValue(() => newValue);
    }

    return [value, setLocalStorageValue] as const;
}
