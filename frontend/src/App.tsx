import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import ResourcesPage from './pages/ResourcesPage';
import SchedulerPage from './pages/SchedulerPage';
import ScenariosPage from './pages/ScenariosPage';
import ErrorsPage from './pages/ErrorsPage';
import AuditPage from './pages/AuditPage';
import InsightsPage from './pages/InsightsPage';
import ReportsPage from './pages/ReportsPage';
import RequirementsPage from './pages/RequirementsPage';
import FailureLabPage from './pages/FailureLabPage';
import ConstraintsPage from './pages/ConstraintsPage';
import SettingsPage from './pages/SettingsPage';
import BottlenecksPage from './pages/BottlenecksPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/constraints" element={<ConstraintsPage />} />
                <Route path="/scheduler" element={<SchedulerPage />} />
                <Route path="/scenarios" element={<ScenariosPage />} />
                <Route path="/bottlenecks" element={<BottlenecksPage />} />
                <Route path="/errors" element={<ErrorsPage />} />
                <Route path="/failure-lab" element={<FailureLabPage />} />
                <Route path="/environment" element={<InsightsPage defaultTab="environment" />} />
                <Route path="/ethics" element={<InsightsPage defaultTab="ethics" />} />
                <Route path="/maintenance" element={<InsightsPage defaultTab="maintenance" />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/requirements" element={<RequirementsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
