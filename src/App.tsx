import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const StudentManagementPage = lazy(() => import("@/pages/StudentManagementPage"));
const HomeworkSenderPage = lazy(() => import("@/pages/HomeworkSenderPage"));
const ComplaintSenderPage = lazy(() => import("@/pages/ComplaintSenderPage"));
const ResultSenderPage = lazy(() => import("@/pages/ResultSenderPage"));
const FeesReminderPage = lazy(() => import("@/pages/FeesReminderPage"));
const AnnouncementsPage = lazy(() => import("@/pages/AnnouncementsPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const AIChatbotPage = lazy(() => import("@/pages/AIChatbotPage"));
const PromotionPanelPage = lazy(() => import("@/pages/PromotionPanelPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ScrollToTop />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="students" element={<StudentManagementPage />} />
                <Route path="homework" element={<HomeworkSenderPage />} />
                <Route path="complaints" element={<ComplaintSenderPage />} />
                <Route path="results" element={<ResultSenderPage />} />
                <Route path="fees" element={<FeesReminderPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="ai-chatbot" element={<AIChatbotPage />} />
                <Route path="promotion" element={<PromotionPanelPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
