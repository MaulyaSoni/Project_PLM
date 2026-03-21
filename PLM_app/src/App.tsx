import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute, RoleRoute } from "@/components/ProtectedRoute";
import { useAuthStore } from "@/stores/useAuthStore";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import BOMsPage from "./pages/BOMsPage";
import ECOsPage from "./pages/ECOsPage";
import ECODetailPage from "./pages/ECODetailPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import ECOCreatePage from "./pages/ECOCreatePage";
import ForbiddenPage from "./pages/ForbiddenPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/boms" element={<BOMsPage />} />
          <Route path="/ecos" element={<ECOsPage />} />
          <Route path="/ecos/create" element={<RoleRoute roles={['ADMIN', 'ENGINEERING']}><ECOCreatePage /></RoleRoute>} />
          <Route path="/ecos/:id" element={<ECODetailPage />} />
          <Route path="/reports" element={<RoleRoute roles={['ADMIN', 'APPROVER']}><ReportsPage /></RoleRoute>} />
          <Route path="/settings" element={<RoleRoute roles={['ADMIN']} message="Admin access required"><SettingsPage /></RoleRoute>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
