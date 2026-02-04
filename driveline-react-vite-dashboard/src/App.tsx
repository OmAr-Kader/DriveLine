import React, { Suspense, lazy, useState, useEffect } from 'react';

import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, NAV_ITEMS } from './routes';
const Users = lazy(() => import('./pages/Users'));
const FixServices = lazy(() => import('./pages/FixServices'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const UserPage = lazy(() => import('./pages/[id]/User'));
const Courses = lazy(() => import('./pages/Courses'));
const ShortVideos = lazy(() => import('./pages/ShortVideos'));const AnalyticsTabs = lazy(() => import('./pages/AnalyticsTabs'));import './App.css';
import DriveLineLogo from './assets/DriveLine.png';
import { AuthStorage, NavigationStorage } from './utils/storage';

const LoadingFallback = <div className="loading">Loading...</div>;

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return AuthStorage.isAuthenticated() ? <>{children}</> : <Navigate to={ROUTES.login} replace />;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [savedRoute, setSavedRoute] = useState<string | null>(NavigationStorage.getSelectedRoute());

  useEffect(() => {
    // If user is at home root and there is a saved route, redirect there once
    if (location.pathname === ROUTES.home && savedRoute && savedRoute !== ROUTES.home) {
      navigate(savedRoute, { replace: true });
    }
  }, [location.pathname, savedRoute, navigate]);

  const handleLogout = () => {
    AuthStorage.clear();
    NavigationStorage.clearSelectedRoute();
    window.location.href = ROUTES.login;
  };

  const handleNavClick = (path: string, disabled?: boolean) => {
    if (disabled) return;
    NavigationStorage.setSelectedRoute(path);
    setSavedRoute(path);
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <img src={DriveLineLogo} alt="DriveLine" />
          DriveLine
        </div>
        <div className="navbar-links">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === location.pathname;
            const isSaved = !!savedRoute && savedRoute === item.path && !isActive;
            const classes = `${item.disabled ? 'disabled' : ''} ${isActive ? 'active' : ''} ${isSaved ? 'saved' : ''}`.trim();
            return (
              <Link
                key={item.path}
                to={item.path}
                className={classes}
                onClick={() => handleNavClick(item.path, item.disabled)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>
      <main className="content">{children}</main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/">
      <Suspense fallback={LoadingFallback}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.users}`}
            element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.fixServices}`}
            element={
              <ProtectedRoute>
                <Layout>
                  <FixServices />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.users}/:id`}
            element={
              <ProtectedRoute>
                <Layout>
                  <UserPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.courses}`}
            element={
              <ProtectedRoute>
                <Layout>
                  <Courses />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.shortVideos}`}
            element={
              <ProtectedRoute>
                <Layout>
                  <ShortVideos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.analytics}`}
            element={
              <ProtectedRoute>
                <Layout>
                  <AnalyticsTabs />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Future routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
