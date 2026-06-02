import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import TelaLogin from "./pages/Login/TelaLogin";
import Form from "./pages/FormDoadores/Form";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import EspecialistaForm from "./pages/EspecialistaForm/EspecialistaForm";
import EspecialistaDashboard from "./pages/Especialista/EspecialistaDashboard";
import PontoColetaApp from "./pages/PontoColeta/PontoColetaApp";

export default function App() {
  const navigate = useNavigate();

  function handleLogin(p) {
    if (p === "defesa") {
      navigate("/admin", { replace: true });
    }
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/especialistas/cadastro" element={<EspecialistaForm />} />
      <Route path="/especialistas/painel" element={<EspecialistaDashboard />} />
      <Route path="/login" element={<TelaLogin onLogin={handleLogin} />} />
      <Route path="/form" element={<Form />} />
      <Route path="/pontos-coleta/*" element={<PontoColetaApp />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
