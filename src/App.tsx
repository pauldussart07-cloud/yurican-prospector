import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TargetingProvider } from "@/contexts/TargetingContext";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Leads from "./pages/Leads";
import Targeting from "./pages/Targeting";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";

const App = () => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
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
                  <Header />
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
};

export default App;
