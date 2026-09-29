import { BrowserRouter } from "react-router-dom";
import { PlatformProvider } from "../shared/platform/PlatformProvider";
import { ToastProvider } from "../shared/ui/Toast/Toast";
import { UpdateChecker } from "../shared/ui/UpdateChecker/UpdateChecker";
import { AppRoutes } from "./AppRoutes";
import { ErrorBoundary } from "./ErrorBoundary";

function App() {
    return (
        <ErrorBoundary>
            <PlatformProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <AppRoutes />
                        <UpdateChecker />
                    </BrowserRouter>
                </ToastProvider>
            </PlatformProvider>
        </ErrorBoundary>
    );
}

export default App;
