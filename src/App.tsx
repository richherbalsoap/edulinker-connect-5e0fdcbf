import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";
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
import NotFound from "@/pages/NotFound";
import InstallPage from "@/pages/InstallPage";

const queryClient = new QueryClient();

// PWA auto-update listener — naya SW aane par 3 second baad auto reload
function usePWAAutoUpdate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleSWUpdate = (registration: ServiceWorkerRegistration) => {
      const newSW = registration.installing || registration.waiting;
      if (!newSW) return;

      newSW.addEventListener("statechange", () => {
        if (newSW.state === "activated") {
          toast.success("EDULinker update ho gaya! Reload ho raha hai...", {
            duration: 3000,
          });
          setTimeout(() => window.location.reload(), 3000);
        }
      });
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        // Already registered — update check karo
        reg.addEventListener("updatefound", () => handleSWUpdate(reg));
        // Periodic check: har 60 seconds mein
        const interval = setInterval(() => reg.update(), 60000);
        return () => clearInterval(interval);
      }
    });

    // Naya registration
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);
}

const AppContent = () => {
  usePWAAutoUpdate();

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
