import { createSignal } from "solid-js";
import type { AlertType } from "../types/types";

export function useAlerts() {
    const animationTime = 2; // seconds
    const alertDuration = 1; // seconds
    const [alerts, setAlerts] = createSignal<AlertType[]>([]);

    function addAlert(msg: string) {
        const alertId = crypto.randomUUID();

        setAlerts((prev) => [{ msg, id: alertId, active: true }, ...prev]);

        setTimeout(() => {
            setAlerts((prev) => {
                for (let i = 0; i < prev.length; i++) {
                    if (prev[i].id === alertId) {
                        prev[i].active = false;
                        prev[i] = { ...prev[i] };
                        break;
                    }
                }

                return [...prev];
            });
        }, alertDuration * 1000);

        setTimeout(
            () => {
                setAlerts((prev) => prev.filter((item) => item.id !== alertId));
            },
            alertDuration * 1000 + animationTime * 1000,
        );
    }

    return [alerts, addAlert] as const;
}
