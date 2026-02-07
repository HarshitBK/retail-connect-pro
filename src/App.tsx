import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EmployeeRegister from "./pages/employee/EmployeeRegister";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployerRegister from "./pages/employer/EmployerRegister";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import FindCandidates from "./pages/employer/FindCandidates";
import Login from "./pages/auth/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Index />} />
          
          {/* Employee Routes */}
          <Route path="/employee/register" element={<EmployeeRegister />} />
          <Route path="/employee/login" element={<Login />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          
          {/* Employer Routes */}
          <Route path="/employer/register" element={<EmployerRegister />} />
          <Route path="/employer/login" element={<Login />} />
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          <Route path="/employer/find-candidates" element={<FindCandidates />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
