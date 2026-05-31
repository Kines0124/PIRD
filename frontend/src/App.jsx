import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import TelaLogin from "./pages/Login/TelaLogin";
import DashboardDefesa from "./pages/Dashboard/DashboardDefesa";
import DashboardUsuario from "./pages/Dashboard/DashboardUsuario";
import Ocorrencias from "./pages/Ocorrencias/Ocorrencias";
import PontosColeta from "./pages/PontosColeta/PontosColeta";
import PortalDefesa from "./pages/Portal/PortalDefesa";
import PortalDoador from "./pages/Portal/PortalDoador";
import Form from "./pages/FormDoadores/Form"
import AdminDashboard from "./pages/Admin/AdminDashboard";
import EspecialistaForm from "./pages/EspecialistaForm/EspecialistaForm";
import EspecialistaDashboard from "./pages/Especialista/EspecialistaDashboard";
import PontoColetaApp from "./pages/PontoColeta/PontoColetaApp";

function LayoutProtegido({ perfil, onLogout }) {
  if (!perfil) return <Navigate to="/login" replace />;

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg-base)",
      fontFamily: "var(--font-body)",
      color: "var(--text-primary)",
    }}>
      <Sidebar perfil={perfil} />

      <main style={{ flex: 1, overflowY: "auto", maxHeight: "100vh" }}>
        <Routes>
          {perfil === "defesa" ? (
            <>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardDefesa />} />
              <Route path="ocorrencias" element={<Ocorrencias perfil="defesa" />} />
              <Route path="pontos" element={<PontosColeta perfil="defesa" />} />
              <Route path="portal" element={<PortalDefesa />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </>
          ) : (
            <>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardUsuario />} />
              <Route path="pontos" element={<PontosColeta perfil="usuario" />} />
              <Route path="ocorrencias" element={<Ocorrencias perfil="usuario" />} />
              <Route path="portal" element={<PortalDoador />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </>
          )}
        </Routes>
      </main>

      <button
        onClick={onLogout}
        style={{
          position: "fixed",
          top: 14,
          right: 16,
          zIndex: 999,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "5px 14px",
          color: "var(--text-muted)",
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
          transition: "color 0.15s, border-color 0.15s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "var(--text-primary)";
          e.currentTarget.style.borderColor = "var(--border-strong)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        trocar perfil
      </button>
    </div>
  );
}

export default function App() {
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  function handleLogin(p) {
    if (p === "defesa") {
      navigate("/admin", { replace: true });
      return;
    }
    setPerfil(p);
    navigate("/app/dashboard", { replace: true });
  }

  function handleLogout() {
    setPerfil(null);
    navigate("/login", { replace: true });
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/especialistas/cadastro" element={<EspecialistaForm />} />
      <Route path="/especialistas/painel" element={<EspecialistaDashboard />} />
      <Route path="/login" element={<TelaLogin onLogin={handleLogin} />} />
      <Route path="/form" element={<Form />} />
      <Route path="/pontos-coleta/*" element={<PontoColetaApp />} />
      <Route
        path="/app/*"
        element={<LayoutProtegido perfil={perfil} onLogout={handleLogout} />}
      />
      <Route
        path="/"
        element={<Navigate to={perfil ? "/app/dashboard" : "/login"} replace />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
