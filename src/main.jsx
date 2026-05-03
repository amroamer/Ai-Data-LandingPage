import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { I18nProvider } from "./i18n/i18n";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";
import App from "./App.jsx";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SettingsPage from "./pages/SettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/ai-data">
      <I18nProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<App />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
);
