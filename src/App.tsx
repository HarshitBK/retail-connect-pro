import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Certifications from "./pages/Certifications";
import AvailableTests from "./pages/AvailableTests";

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AuthCallback from "./pages/auth/AuthCallback";

// Employee Pages
import EmployeeRegister from "./pages/employee/EmployeeRegister";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import TakeTest from "./pages/employee/TakeTest";
import EmployeeProfileEdit from "./pages/employee/EmployeeProfileEdit";

// Employer Pages
import EmployerRegister from "./pages/employer/EmployerRegister";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerProfileEdit from "./pages/employer/EmployerProfileEdit";
import FindCandidates from "./pages/employer/FindCandidates";
import CreateTest from "./pages/employer/CreateTest";
import ViewTests from "./pages/employer/ViewTests";
import EditTest from "./pages/employer/EditTest";
import TestResults from "./pages/employer/TestResults";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/certifications" element={<Certifications />} />
            <Route path="/tests" element={<AvailableTests />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Employee Routes */}
            <Route path="/employee/register" element={<EmployeeRegister />} />
            <Route path="/employee/login" element={<Login />} />
            <Route 
              path="/employee/dashboard" 
              element={
                <ProtectedRoute userType="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/profile/edit" 
              element={
                <ProtectedRoute userType="employee">
                  <EmployeeProfileEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tests/:testId/take" 
              element={
                <ProtectedRoute userType="employee">
                  <TakeTest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employer/profile/edit" 
              element={
                <ProtectedRoute userType="employer">
                  <EmployerProfileEdit />
                </ProtectedRoute>
              } 
            />
            
            {/* Employer Routes */}
            <Route path="/employer/register" element={<EmployerRegister />} />
            <Route path="/employer/login" element={<Login />} />
            <Route 
              path="/employer/dashboard" 
              element={
                <ProtectedRoute userType="employer">
                  <EmployerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employer/find-candidates" 
              element={
                <ProtectedRoute userType="employer">
                  <FindCandidates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employer/tests" 
              element={
                <ProtectedRoute userType="employer">
                  <ViewTests />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employer/tests/create" 
              element={
                <ProtectedRoute userType="employer">
                  <CreateTest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employer/tests/:testId/edit" 
              element={
                <ProtectedRoute userType="employer">
                  <EditTest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employer/tests/:testId/results" 
              element={
                <ProtectedRoute userType="employer">
                  <TestResults />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
