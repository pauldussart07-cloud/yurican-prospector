import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TargetingProvider } from "@/contexts/TargetingContext";
import Vision from "./pages/Vision";
import Marche from "./pages/Marche";
import Prospects from "./pages/Prospects";
import Targeting from "./pages/Targeting";
import Parametrage from "./pages/Parametrage";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";

const queryClient = new QueryClient();

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
                <Header />
                <div className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Vision />} />
                    <Route path="/marche" element={<Marche />} />
                    <Route path="/prospects" element={<Prospects />} />
                    <Route path="/targeting" element={<Targeting />} />
                    <Route path="/parametrage" element={<Parametrage />} />
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
