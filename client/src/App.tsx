import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import StudentDashboard from "./pages/student/Dashboard";
import StudentPractice from "./pages/student/Practice";
import CompanyDashboard from "./pages/company/Dashboard";
import PracticeResultPage from "./pages/student/PracticeResultPage";
import CompanyJobForm from "./pages/company/CompanyJobForm";
import StudentJobsPage from "./pages/student/StudentsJobsPage";
import StudentProfile from "./pages/student/StudentProfile";
import JobDetailPage from "./pages/student/JobDetailPage";
import CompanyJobsPage from "./pages/company/CompanyJobsPage";
import CompanyJobApplicationsPage from "./pages/company/CompanyJobApplicationsPage";
import ApplicationDetailPage from "./pages/company/ApplicationDetailPage";
import StudentApplicationsPage from "./pages/student/StudentApplicationsPage";
import StudentApplicationDetailPage from "./pages/student/StudentApplicationDetailPage";

// inside <Routes>

const queryClient = new QueryClient();

const App = () => (
  <div className="min-h-screen dark:bg-[#0f172a] dark:text-gray-100">
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="interviewpro-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/practice" element={<StudentPractice />} />
              <Route path="/company/dashboard" element={<CompanyDashboard />} />
              <Route
                path="/student/practice-result"
                element={<PracticeResultPage />}
              />
              <Route path="/company/job/new" element={<CompanyJobForm />} />
              <Route path="/student/jobs" element={<StudentJobsPage />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/jobs/:id" element={<JobDetailPage />} />
              <Route path="/company/jobs" element={<CompanyJobsPage />} />
              <Route
                path="/company/job/:id"
                element={<CompanyJobApplicationsPage />}
              />
              <Route
                path="/company/job/:jobId/:applicationId"
                element={<ApplicationDetailPage />}
              />
              <Route
                path="/student/applications"
                element={<StudentApplicationsPage />}
              />
              <Route
                path="/student/application/:id"
                element={<StudentApplicationDetailPage />}
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </div>
);

export default App;
