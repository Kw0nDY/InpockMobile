import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";

// Pages
import LandingPage from "./pages/landing";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import DashboardPage from "./pages/dashboard";
import LinksPage from "./pages/links";
import MarketplacePage from "./pages/marketplace";
import ManagerPage from "./pages/manager";
import SettingsPage from "./pages/settings";
import ChatPage from "./pages/chat";
import NotFound from "./pages/not-found";

// Layout
import BottomNav from "./components/layout/bottom-nav";

function Router() {
  const [location] = useLocation();
  
  // Pages that should not show bottom navigation
  const hideNavPages = ["/login", "/signup", "/"];
  const shouldShowBottomNav = !hideNavPages.includes(location);

  return (
    <div className="mobile-container">
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/links" component={LinksPage} />
        <Route path="/marketplace" component={MarketplacePage} />
        <Route path="/manager" component={ManagerPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/chat" component={ChatPage} />
        <Route component={NotFound} />
      </Switch>
      {shouldShowBottomNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
