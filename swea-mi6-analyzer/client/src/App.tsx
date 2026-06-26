import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AnalyzerPage from "./pages/AnalyzerPage";
import HistoryPage from "./pages/HistoryPage";
import ReferencePage from "./pages/ReferencePage";
import QuantPage from "./pages/QuantPage";
import AppLayout from "./components/AppLayout";
import PasswordGate from "./components/PasswordGate";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path={"/"} component={AnalyzerPage} />
        <Route path={"/history"} component={HistoryPage} />
        <Route path={"/reference"} component={ReferencePage} />
        <Route path={"/quant"} component={QuantPage} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <PasswordGate>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </PasswordGate>
    </ErrorBoundary>
  );
}

export default App;
