import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorScreen } from "../screens/ErrorScreen/ErrorScreen";

type Props = { children: ReactNode };
type State = { hasError: boolean };

// Без этого один необработанный throw в рендере ЛЮБОГО компонента ниже по
// дереву (например, .toFixed() на поле, которое backend вдруг стал отдавать
// не в том формате — так уже было с rating_avg) валит всё приложение в
// пустой белый экран без единой подсказки, что случилось. Класс, не
// функция — React Error Boundary работают только через
// componentDidCatch/getDerivedStateFromError, хуков-аналогов нет.
export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Необработанная ошибка рендера:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorScreen
                    title="Что-то пошло не так"
                    description="Приложение столкнулось с ошибкой. Попробуйте перезапустить."
                    actionText="Перезагрузить"
                    onAction={() => window.location.reload()}
                />
            );
        }
        return this.props.children;
    }
}
