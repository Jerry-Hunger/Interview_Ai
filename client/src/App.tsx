import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navigation from "@/components/Navigation";

const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Login = React.lazy(() => import("./pages/auth/Login"));
const Register = React.lazy(() => import("./pages/auth/Register"));
const StudentDashboard = React.lazy(() => import("./pages/student/Dashboard"));
const StudentPractice = React.lazy(() => import("./pages/student/Practice"));
const CompanyDashboard = React.lazy(() => import("./pages/company/Dashboard"));
const PracticeResultPage = React.lazy(() => import("./pages/student/PracticeResultPage"));
const CompanyJobForm = React.lazy(() => import("./pages/company/CompanyJobForm"));
const StudentJobsPage = React.lazy(() => import("./pages/student/StudentsJobsPage"));
const StudentProfile = React.lazy(() => import("./pages/student/StudentProfile"));
const JobDetailPage = React.lazy(() => import("./pages/student/JobDetailPage"));
const CompanyJobsPage = React.lazy(() => import("./pages/company/CompanyJobsPage"));
const CompanyJobApplicationsPage = React.lazy(() => import("./pages/company/CompanyJobApplicationsPage"));
const ApplicationDetailPage = React.lazy(() => import("./pages/company/ApplicationDetailPage"));
const StudentApplicationsPage = React.lazy(() => import("./pages/student/StudentApplicationsPage"));
const StudentApplicationDetailPage = React.lazy(() => import("./pages/student/StudentApplicationDetailPage"));
const CompanyProfilePage = React.lazy(() => import("./pages/company/CompanyProfile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <div className="min-h-screen dark:bg-[#0f172a] dark:text-gray-100">
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="interviewpro-ui-theme">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Navigation />
            <Suspense fallback={null}>
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
                <Route path="/company/profile" element={<CompanyProfilePage />} />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </div>
);

export default App;
