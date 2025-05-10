import { CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from './stores/authStore';
import theme from './theme';
import { useEffect } from 'react';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

// Pages
import AuthCallback from './pages/AuthCallback';
import BotDetail from './pages/BotDetail';
import BotList from './pages/BotList';
import CreateBot from './pages/CreateBot';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  const { initialize } = useAuthStore();
  
  // Initialize authentication state when the app loads
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Auth routes */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Public routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          {/* Protected routes */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bots" element={<BotList />} />
            <Route path="/bots/create" element={<CreateBot />} />
            <Route path="/bots/:id" element={<BotDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
