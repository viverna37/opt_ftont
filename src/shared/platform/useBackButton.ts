import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { showBackButton } from "./telegram";

// Аппаратная «Назад» Telegram на экранах второго уровня. to — куда
// вернуться явно (например, после отправки заявки назад в корзину не нужно).
export function useBackButton(to?: string) {
    const navigate = useNavigate();
    useEffect(() => showBackButton(() => (to ? navigate(to) : navigate(-1))), [navigate, to]);
}
