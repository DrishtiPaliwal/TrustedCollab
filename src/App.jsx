import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';
import AppShell from '@/components/AppShell';
import Dashboard from '@/pages/Dashboard';
import Onboarding from '@/pages/Onboarding';
import Marketplace from '@/pages/Marketplace';
import CreatorProfileView from '@/pages/CreatorProfileView';
import BrandProfileView from '@/pages/BrandProfileView';
import CreatorProfileEdit from '@/pages/CreatorProfileEdit';
import BrandProfileEdit from '@/pages/BrandProfileEdit';
import SocialAccounts from '@/pages/SocialAccounts';
import Products from '@/pages/Products';
import Documents from '@/pages/Documents';
import Campaigns from '@/pages/Campaigns';
import Requests from '@/pages/Requests';
import Verification from '@/pages/Verification';
import AdminVerifications from '@/pages/AdminVerifications';
import AdminDisputes from '@/pages/AdminDisputes';
import Settings from '@/pages/Settings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/creators/:id" element={<CreatorProfileView />} />
          <Route path="/brands/:id" element={<BrandProfileView />} />
          <Route path="/profile" element={<CreatorProfileEdit />} />
          <Route path="/company" element={<BrandProfileEdit />} />
          <Route path="/social" element={<SocialAccounts />} />
          <Route path="/products" element={<Products />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/admin/verifications" element={<AdminVerifications />} />
          <Route path="/admin/disputes" element={<AdminDisputes />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App