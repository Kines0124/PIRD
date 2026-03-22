import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TelaLogin from "./pages/Login/TelaLogin";
import DashboardDefesa from "./pages/Dashboard/DashboardDefesa";
import DashboardUsuario from "./pages/Dashboard/DashboardUsuario";
import Ocorrencias from "./pages/Ocorrencias/Ocorrencias";
import PontosColeta from "./pages/PontosColeta/PontosColeta";
import PortalDefesa from "./pages/Portal/PortalDefesa";
import PortalDoador from "./pages/Portal/PortalDoador";

export default function App() {
  const [perfil, setPerfil] = useState(null);
  const [active, setActive] = useState("dashboard");

  if (!perfil) return <TelaLogin onLogin={p => { setPerfil(p); setActive("dashboard"); }} />;

  function renderContent() {
    if (perfil === "defesa") {
      switch (active) {
        case "dashboard":   return <DashboardDefesa onNavigate={setActive} />;
        case "ocorrencias": return <Ocorrencias perfil="defesa" />;
        case "pontos":      return <PontosColeta perfil="defesa" />;
        case "portal":      return <PortalDefesa />;
        default:            return <DashboardDefesa onNavigate={setActive} />;
      }
    } else {
      switch (active) {
        case "dashboard":   return <DashboardUsuario onNavigate={setActive} />;
        case "pontos":      return <PontosColeta perfil="usuario" />;
        case "ocorrencias": return <Ocorrencias perfil="usuario" />;
        case "portal":      return <PortalDoador />;
        default:            return <DashboardUsuario onNavigate={setActive} />;
      }
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#050e1a", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e2e8f0" }}>
      <Sidebar active={active} setActive={setActive} perfil={perfil} />
      <main style={{ flex: 1, overflowY: "auto", maxHeight: "100vh" }}>
        {renderContent()}
      </main>
      <button
        onClick={() => { setPerfil(null); setActive("dashboard"); }}
        style={{ position: "fixed", top: 14, right: 16, zIndex: 999, background: "#0a1628", border: "1px solid #0f2040", borderRadius: 20, padding: "5px 12px", color: "#475569", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}
      >
        trocar perfil
      </button>
    </div>
  );
}
