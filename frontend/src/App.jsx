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

// ---------------------------------------------------------------------------
// Layout protegido — envolve todas as telas que exigem login (têm Sidebar)
// ---------------------------------------------------------------------------
function LayoutProtegido({ perfil, onLogout }) {
  if (!perfil) return <Navigate to="/login" replace />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#050e1a",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
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
          background: "#0a1628",
          border: "1px solid #0f2040",
          borderRadius: 20,
          padding: "5px 12px",
          color: "#475569",
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        trocar perfil
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App — gerencia apenas o estado de autenticação e define as rotas raiz
// ---------------------------------------------------------------------------
export default function App() {
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  function handleLogin(p) {
    setPerfil(p);
    navigate("/app/dashboard", { replace: true });
  }

  function handleLogout() {
    setPerfil(null);
    navigate("/login", { replace: true });
  }

  return (
    <Routes>
      {/* Rota pública: login */}
      <Route path="/login" element={<TelaLogin onLogin={handleLogin} />} />

      <Route path="/form" element={<Form />} />

      {/* Rotas públicas sem layout — formulários anônimos ficam aqui */}
      {/* <Route path="/doar" element={<FormDoadores />} /> */}

      {/* Rotas protegidas — passam pelo LayoutProtegido com Sidebar */}
      <Route
        path="/app/*"
        element={<LayoutProtegido perfil={perfil} onLogout={handleLogout} />}
      />

      {/* Raiz e qualquer URL desconhecida redirecionam adequadamente */}
      <Route
        path="/"
        element={<Navigate to={perfil ? "/app/dashboard" : "/login"} replace />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}