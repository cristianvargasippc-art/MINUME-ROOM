import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Commissions from './pages/Commissions';
import CommissionDetail from './pages/CommissionDetail';
import Assignments from './pages/Assignments';
import AssignmentDetail from './pages/AssignmentDetail';
import Alerts from './pages/Alerts';

const LegacyRedirect = ({ basePath }) => {
  const { id } = useParams();
  return <Navigate to={`${basePath}${id ? `/${id}` : ''}`} replace />;
};

const App = () => (
  <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Navigate to="/room/dashboard" replace />} />
        <Route path="/commissions" element={<Navigate to="/room/commissions" replace />} />
        <Route path="/commissions/:id" element={<LegacyRedirect basePath="/room/commissions" />} />
        <Route path="/assignments" element={<Navigate to="/room/assignments" replace />} />
        <Route path="/assignments/:id" element={<LegacyRedirect basePath="/room/assignments" />} />
        <Route path="/alerts" element={<Navigate to="/room/alerts" replace />} />
        <Route
          path="/room"
          element={(
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="/room/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="commissions" element={<Commissions />} />
          <Route path="commissions/:id" element={<CommissionDetail />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="assignments/:id" element={<AssignmentDetail />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme="colored"
      />
      </BrowserRouter>
    </AuthProvider>
  </LanguageProvider>
);

export default App;
