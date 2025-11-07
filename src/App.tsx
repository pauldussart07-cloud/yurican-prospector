import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TargetingProvider } from "@/contexts/TargetingContext";
import { ActionsProvider } from "@/contexts/ActionsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Vision from "./pages/Vision";
import Marche from "./pages/Marche";
import Prospects from "./pages/Prospects";
import Agenda from "./pages/Agenda";
import Sequences from "./pages/Sequences";
import SequenceEditor from "./pages/SequenceEditor";
import Targeting from "./pages/Targeting";
import Parametrage from "./pages/Parametrage";
import ProspectsMobile from "./pages/ProspectsMobile";
import ListsView from "./pages/ListsView";
import AgendaMobile from "./pages/AgendaMobile";
import ParametrageMobile from "./pages/ParametrageMobile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Header from "./components/Header";
import ContactActivities from "./pages/ContactActivities";
import CompanyActivities from "./pages/CompanyActivities";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TargetingProvider>
          <ActionsProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
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
                              <Route path="/agenda" element={<Agenda />} />
                              <Route path="/sequences" element={<Sequences />} />
                              <Route path="/sequences/:id" element={<SequenceEditor />} />
                              <Route path="/targeting" element={<Targeting />} />
                              <Route path="/parametrage" element={<Parametrage />} />
                              <Route path="/prospects-mobile" element={<ProspectsMobile />} />
                              <Route path="/lists" element={<ListsView />} />
                              <Route path="/agenda-mobile" element={<AgendaMobile />} />
                              <Route path="/parametrage-mobile" element={<ParametrageMobile />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/contact-activities/:contactId" element={<ContactActivities />} />
                              <Route path="/company-activities/:leadId" element={<CompanyActivities />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </div>
                        </main>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ActionsProvider>
        </TargetingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
