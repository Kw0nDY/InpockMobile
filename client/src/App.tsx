import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { useAnalytics } from "./hooks/use-analytics";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";

// Pages
import LandingPage from "./pages/landing";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import SignupStep1 from "./pages/signup-step1";
import SignupStep2 from "./pages/signup-step2";
import DashboardPage from "./pages/dashboard";
import LinksPage from "./pages/links";
import ImagesPage from "./pages/images";
import VideosPage from "./pages/videos";
import MarketplacePage from "./pages/marketplace";
import ManagerPage from "./pages/manager";
import ServiceIntroPage from "./pages/service-intro";
import SettingsPage from "./pages/settings";
import ChatPage from "./pages/chat";
import AnalyticsPage from "./pages/analytics";
import ContactsPage from "./pages/contacts";
import KakaoCallback from "./pages/kakao-callback";
import ForgotPasswordPage from "./pages/forgot-password";
import FindIdPage from "./pages/find-id";
import ProfilePage from "./pages/profile";
import PublicViewPage from "./pages/public-view";
import ResetPasswordPage from "./pages/reset-password";
import NotFound from "./pages/not-found";

// Layout
import BottomNav from "./components/layout/bottom-nav";

function Router() {
  const [location] = useLocation();
  
  // Initialize analytics tracking for all page navigation
  useAnalytics();
  
  // Pages that should not show bottom navigation
  const hideNavPages = ["/login", "/signup", "/signup-step1", "/signup-step2", "/", "/forgot-password", "/find-id", "/reset-password", "/service-intro"];
  const shouldShowBottomNav = !hideNavPages.includes(location) && !location.startsWith("/reset-password/") && !location.startsWith("/users/");

  return (
    <>
      <div className="mobile-container">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/signup-step1" component={SignupStep1} />
          <Route path="/signup-step2" component={SignupStep2} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/links" component={LinksPage} />
          <Route path="/images" component={ImagesPage} />
          <Route path="/videos" component={VideosPage} />
          <Route path="/service-intro" component={ServiceIntroPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/chat" component={ChatPage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/contacts" component={ContactsPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/find-id" component={FindIdPage} />
          <Route path="/reset-password/:token" component={ResetPasswordPage} />
          <Route path="/oauth/kakao/callback" component={KakaoCallback} />
          <Route path="/users/:username" component={PublicViewPage} />
          <Route path="/:customUrl" component={PublicViewPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {shouldShowBottomNav && <BottomNav />}
    </>
  );
}

function App() {
  useEffect(() => {
    // Initialize Google Analytics on app startup
    initGA();
  }, []);

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
