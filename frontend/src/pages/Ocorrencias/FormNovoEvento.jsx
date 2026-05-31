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
    <div className="dot-bg" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid rgba(222,57,63,0.25)", borderRadius: 14, padding: 22, marginBottom: 20 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 16 }}>Nova Ocorrência</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Título</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Alagamento Estoril"
            style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)" }} />
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Descrição</label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes..."
            style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)" }} />
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Endereço</label>
          <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, bairro..."
            style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)" }} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
          Severidade {severidade && <span style={{ color: severityColor[severidade] }}>— {LABEL_SEV[severidade]}</span>}
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setSeveridade(n)} style={{
              flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer",
              fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, transition: "all 0.15s",
              border: severidade === n ? `2px solid ${severityColor[n]}` : `1px solid ${severityColor[n]}40`,
              background: severidade === n ? `${severityColor[n]}30` : `${severityColor[n]}10`,
              color: severityColor[n],
              transform: severidade === n ? "scale(1.06)" : "scale(1)",
            }}>{n}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {status === "ok" && <span style={{ fontSize: 12, color: "var(--success)", fontFamily: "var(--font-mono)" }}>✓ Evento registrado e alerta enviado!</span>}
        {status === "erro" && <span style={{ fontSize: 12, color: "var(--red)", fontFamily: "var(--font-mono)" }}>✗ Erro ao enviar.</span>}
        <button onClick={registrar} disabled={status === "enviando"} style={{
          marginLeft: "auto", padding: "10px 24px", borderRadius: "var(--radius)", border: "none",
          background: status === "enviando" ? "var(--bg-elevated)" : "var(--red)",
          color: status === "enviando" ? "var(--text-muted)" : "#fff",
          fontWeight: 700, fontSize: 13,
          cursor: status === "enviando" ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body)",
          transition: "background 0.15s",
        }}>
          {status === "enviando" ? "⏳ ENVIANDO..." : "🚨 REGISTRAR EVENTO"}
        </button>
      </div>
    </div>
  );
}
