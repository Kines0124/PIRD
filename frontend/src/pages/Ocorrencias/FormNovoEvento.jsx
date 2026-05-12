import { useState } from "react";
import { severityColor } from "../../constants/theme";
import { registrarEvento } from "../../services/api";

export default function FormNovoEvento({ onFechar }) {
  const [severidade, setSeveridade] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [endereco, setEndereco] = useState("");
  const [status, setStatus] = useState(null);
  const LABEL_SEV = { 1: "Monitoramento", 2: "Baixo", 3: "Médio", 4: "Alto", 5: "Crítico" };

  async function registrar() {
    if (!titulo || !severidade) { alert("Preencha o título e a severidade."); return; }
    setStatus("enviando");
    try {
      await registrarEvento({
        titulo, descricao, endereco, urgencia: severidade,
        severidade_label: LABEL_SEV[severidade],
        abrigo: titulo,
        item: descricao || "Novo evento",
        responsavel: "Defesa Civil Taubaté",
        contato: "5512988551465",
        timestamp: new Date().toISOString(),
      });
      setStatus("ok");
      setTimeout(() => { setStatus(null); onFechar(); }, 2500);
    } catch {
      setStatus("erro");
    }
  }

  return (
    <div style={{ background: "#0a1628", border: "1px solid #ef444430", borderRadius: 14, padding: 22, marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: "#ef4444", letterSpacing: 3, fontFamily: "monospace", marginBottom: 16 }}>NOVA OCORRÊNCIA</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 10, color: "#475569", letterSpacing: 1, fontFamily: "monospace", display: "block", marginBottom: 5 }}>TÍTULO</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Alagamento Estoril"
            style={{ width: "100%", background: "#080d14", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px", color: "#94a3b8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: "#475569", letterSpacing: 1, fontFamily: "monospace", display: "block", marginBottom: 5 }}>DESCRIÇÃO</label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes..."
            style={{ width: "100%", background: "#080d14", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px", color: "#94a3b8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: "#475569", letterSpacing: 1, fontFamily: "monospace", display: "block", marginBottom: 5 }}>ENDEREÇO</label>
          <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, bairro..."
            style={{ width: "100%", background: "#080d14", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px", color: "#94a3b8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, color: "#475569", letterSpacing: 1, fontFamily: "monospace", display: "block", marginBottom: 8 }}>
          SEVERIDADE {severidade && <span style={{ color: severityColor[severidade] }}>— {LABEL_SEV[severidade]}</span>}
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setSeveridade(n)} style={{
              flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer",
              fontFamily: "monospace", fontWeight: 900, fontSize: 16, transition: "all 0.15s",
              border: severidade === n ? `2px solid ${severityColor[n]}` : `1px solid ${severityColor[n]}40`,
              background: severidade === n ? `${severityColor[n]}30` : `${severityColor[n]}10`,
              color: severityColor[n],
              transform: severidade === n ? "scale(1.06)" : "scale(1)",
            }}>{n}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {status === "ok" && <span style={{ fontSize: 12, color: "#10b981", fontFamily: "monospace" }}>✓ Evento registrado e alerta enviado!</span>}
        {status === "erro" && <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "monospace" }}>✗ Erro ao enviar.</span>}
        <button onClick={registrar} disabled={status === "enviando"} style={{
          marginLeft: "auto", padding: "10px 24px", borderRadius: 10, border: "none",
          background: status === "enviando" ? "#1e293b" : "linear-gradient(135deg, #ef4444, #c0392b)",
          color: "#fff", fontWeight: 900, fontSize: 13,
          cursor: status === "enviando" ? "not-allowed" : "pointer", fontFamily: "monospace",
        }}>
          {status === "enviando" ? "⏳ ENVIANDO..." : "🚨 REGISTRAR EVENTO"}
        </button>
      </div>
    </div>
  );
}
