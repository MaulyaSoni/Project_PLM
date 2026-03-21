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
          <Route path="/dashboard" element={<RoleRoute roles={['ADMIN', 'ENGINEERING', 'APPROVER', 'OPERATIONS']}><DashboardPage /></RoleRoute>} />
          <Route path="/products" element={<RoleRoute roles={['ADMIN', 'ENGINEERING', 'APPROVER', 'OPERATIONS']}><ProductsPage /></RoleRoute>} />
          <Route path="/boms" element={<RoleRoute roles={['ADMIN', 'ENGINEERING', 'APPROVER', 'OPERATIONS']}><BOMsPage /></RoleRoute>} />
          <Route path="/ecos" element={<RoleRoute roles={['ADMIN', 'ENGINEERING', 'APPROVER']} message="Operations users have read-only access to Products and BOMs."><ECOsPage /></RoleRoute>} />
          <Route path="/ecos/create" element={<RoleRoute roles={['ENGINEERING']}><ECOCreatePage /></RoleRoute>} />
          <Route path="/ecos/:id" element={<RoleRoute roles={['ADMIN', 'ENGINEERING', 'APPROVER']} message="Operations users have read-only access to Products and BOMs."><ECODetailPage /></RoleRoute>} />
          <Route path="/reports" element={<RoleRoute roles={['ADMIN']} message="Admin access required to view reports."><ReportsPage /></RoleRoute>} />
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
