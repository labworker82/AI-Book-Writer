import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import NewBook from "./pages/NewBook";
import BookEditor from "./pages/BookEditor";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/books/new"} component={NewBook} />
      <Route path={"/books/:id"} component={BookEditor} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/login"} component={Login} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
