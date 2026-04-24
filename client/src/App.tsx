import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Calculator from "@/pages/Home";
import WheelsPage from "@/pages/Wheels";
import SettingsPage from "@/pages/Settings";
import Instructions from "@/pages/Instructions";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calculator} />
      <Route path="/instructions" component={Instructions} />
      <Route path="/wheels" component={WheelsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
