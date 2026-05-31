import { useState, useEffect } from "react";

const BASE = "http://localhost:8080";
const POLL_INTERVAL = 15000;

export default function PendingScreen() {
  const [status, setStatus] = useState("pendente");

  useEffect(() => {
    const id = sessionStorage.getItem("pird_registro_id");
    if (!id) return;

    async function poll() {
      try {
        const res = await fetch(`${BASE}/especialistas/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status) setStatus(data.status);
      } catch { /* ignora erros de rede */ }
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const statusInfo = {
    pendente:  { icon: "⏳", color: "#F5C518", label: "Cadastro em análise",   msg: "Seu cadastro foi recebido pela equipe da Defesa Civil e será analisado em breve. Você será notificado assim que houver uma atualização." },
    aprovado:  { icon: "✅", color: "#22c55e",  label: "Cadastro aprovado!",   msg: "Parabéns! Seu cadastro foi aprovado. Você já pode ser convocado em situações de emergência." },
    reprovado: { icon: "❌", color: "#ef4444",  label: "Cadastro não aprovado", msg: "Infelizmente seu cadastro não foi aprovado neste momento. Entre em contato com a Defesa Civil para mais informações." },
  };

  const info = statusInfo[status] || statusInfo.pendente;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <img src="/resources/logo.png" alt="PIRD" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>BASE</span>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 420, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "40px 28px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>{info.icon}</div>

        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: info.color, marginBottom: 12 }}>
          {info.label}
        </h2>

        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 28 }}>
          {info.msg}
        </p>

        {status === "pendente" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F5C518", display: "inline-block", animation: "pulse 2s infinite" }} />
            Verificando status automaticamente...
          </div>
        )}

        {status !== "pendente" && (
          <a href="/login" style={{ display: "inline-block", marginTop: 8, padding: "12px 28px", borderRadius: 10, background: "var(--accent)", color: "#fff", fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em" }}>
            Ir para o início
          </a>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
