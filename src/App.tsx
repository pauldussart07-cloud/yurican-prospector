import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TargetingProvider, useTargeting } from "@/contexts/TargetingContext";
import { PersonaDialog } from "@/components/PersonaDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Leads from "./pages/Leads";
import Targeting from "./pages/Targeting";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const HeaderContent = () => {
  const navigate = useNavigate();
  const { activeTargeting, credits } = useTargeting();

  return (
    <header className="h-14 border-b border-border flex items-center px-6 bg-background sticky top-0 z-10">
      <SidebarTrigger />
      <div className="ml-auto flex items-center gap-3">
        {activeTargeting && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {activeTargeting.name}
            </Badge>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/targeting')}
        >
          <Target className="h-4 w-4 mr-2" />
          Ciblage
        </Button>
        <PersonaDialog />
        <Badge variant="secondary" className="flex items-center gap-1">
          <Coins className="h-3 w-3" />
          {credits} crédits
        </Badge>
        <div className="text-sm text-muted-foreground">Client Enterprise</div>
      </div>
    </header>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TargetingProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1 flex flex-col">
                <HeaderContent />
                <div className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/targeting" element={<Targeting />} />
                    <Route path="/setup" element={<Setup />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </main>
            </div>
          </SidebarProvider>
        </TargetingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
