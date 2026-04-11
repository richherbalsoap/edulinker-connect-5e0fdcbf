import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/context/AuthContext";
import { PinProvider } from "@/context/PinContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentManagementPage from "@/pages/StudentManagementPage";
import HomeworkSenderPage from "@/pages/HomeworkSenderPage";
import ComplaintSenderPage from "@/pages/ComplaintSenderPage";
import ResultSenderPage from "@/pages/ResultSenderPage";
import FeesReminderPage from "@/pages/FeesReminderPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AIChatbotPage from "@/pages/AIChatbotPage";
import PromotionPanelPage from "@/pages/PromotionPanelPage";
import SettingsPage from "@/pages/SettingsPage";
import ReportPage from "@/pages/ReportPage";
import ImpactDashboardPage from "@/pages/ImpactDashboardPage";
import NotFound from "@/pages/NotFound";
import InstallPage from "@/pages/InstallPage";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AuthProvider>
        <PinProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/gmail-confirmation" element={<ForgotPasswordPage />} />
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
              <Route path="report" element={<ReportPage />} />
              {/* <Route path="impact-dashboard" element={<ImpactDashboardPage />} /> */}{/* Hidden for future release */}
            </Route>
            <Route path="install" element={<InstallPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PinProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
