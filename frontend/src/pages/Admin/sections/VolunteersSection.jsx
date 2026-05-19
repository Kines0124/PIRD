import { useState } from "react";
import { severityBadge, statusBadge, typeIcon } from "../adminTheme.jsx";

export default function VolunteersSection({ volunteers, onApprove, onReject, events }) {
  const [tab, setTab]     = useState("validacao");
  const [selVol, setSelVol] = useState(null);

  const pendingCount  = volunteers.filter(v => v.status === "pendente").length;
  const approvedCount = volunteers.filter(v => v.status === "aprovado").length;

  const approve = id => onApprove && onApprove(id);
  const reject  = id => onReject  && onReject(id);

  const volColors = [
    "linear-gradient(135deg,#FF6B1A,#FF3B3B)",
    "linear-gradient(135deg,#3B82F6,#8B5CF6)",
    "linear-gradient(135deg,#22c55e,#16a34a)",
    "linear-gradient(135deg,#F5C518,#FF8C00)",
  ];

  function eventsForVolunteer(volId) {
    return (events || []).filter(e => (e.volunteerIds || []).includes(volId));
  }

  const selectedVolEvents = selVol ? eventsForVolunteer(selVol.id) : [];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">🙋 Voluntários</div>
          <div className="card-subtitle">RF10, RF11 — Validação e visualização de voluntários</div>
        </div>
        <div className="text-sm text-muted mono">{pendingCount} pendente(s) · {approvedCount} aprovado(s)</div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === "validacao" ? "active" : ""}`} onClick={() => setTab("validacao")}>
          ⏳ Validação {pendingCount > 0 && <span className="nav-badge" style={{ marginLeft: 6 }}>{pendingCount}</span>}
        </div>
        <div className={`tab ${tab === "visualizacao" ? "active" : ""}`} onClick={() => { setTab("visualizacao"); setSelVol(null); }}>
          👥 Voluntários ({approvedCount})
        </div>
      </div>

      {tab === "validacao" && (
        <>
          {pendingCount === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Nenhum voluntário pendente</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Profissional</th><th>Especialidade</th><th>Região</th><th>Cadastro</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {volunteers.filter(v => v.status === "pendente").map((v, i) => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div className="vol-avatar" style={{ background: volColors[i % volColors.length] }}>{v.name[0]}</div>
                          <span style={{ fontWeight: 600 }}>{v.name}</span>
                        </div>
                      </td>
                      <td><span className="text-secondary text-sm">{v.specialty}</span></td>
                      <td><span className="text-muted text-sm mono">📍 {v.region}</span></td>
                      <td><span className="mono text-sm text-muted">{v.registered}</span></td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-success btn-sm" onClick={() => approve(v.id)}>✓ Aprovar</button>
                          <button className="btn btn-danger btn-sm"  onClick={() => reject(v.id)}>✕ Rejeitar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "visualizacao" && (
        <div style={{ display: "flex", gap: 0, minHeight: 400 }}>
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border)", overflowY: "auto" }}>
            {approvedCount === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🙋</div>
                <div className="empty-state-text">Nenhum voluntário aprovado</div>
              </div>
            ) : volunteers.filter(v => v.status === "aprovado").map((v, i) => {
              const volEvs = eventsForVolunteer(v.id);
              const isSelected = selVol?.id === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelVol(prev => prev?.id === v.id ? null : v)}
                  style={{
                    padding: "13px 16px", borderBottom: "1px solid var(--border)",
                    cursor: "pointer", transition: "all 0.15s",
                    background: isSelected ? "var(--bg-hover)" : "transparent",
                    borderLeft: `3px solid ${isSelected ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="vol-avatar" style={{ background: volColors[i % volColors.length], flexShrink: 0 }}>{v.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 1 }}>{v.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", color: volEvs.length > 0 ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 3 }}>
                        {volEvs.length > 0 ? `${volEvs.length} EVENTO${volEvs.length > 1 ? "S" : ""} ASSOCIADO${volEvs.length > 1 ? "S" : ""}` : "SEM EVENTOS ATIVOS"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v.specialty}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📍 {v.region}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
            {!selVol ? (
              <div className="empty-state" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="empty-state-icon">👈</div>
                <div className="empty-state-text">Selecione um voluntário para ver os detalhes</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="vol-avatar" style={{ width: 48, height: 48, fontSize: 18, background: volColors[volunteers.filter(v => v.status === "aprovado").findIndex(v => v.id === selVol.id) % volColors.length] }}>
                    {selVol.name[0]}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{selVol.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{selVol.specialty}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📍 {selVol.region} · cadastro: {selVol.registered}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
                    Eventos Associados ({selectedVolEvents.length})
                  </div>
                  {selectedVolEvents.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "16px 0" }}>
                      Este voluntário não está associado a nenhum evento no momento.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selectedVolEvents.map(e => (
                        <div key={e.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 16 }}>{typeIcon[e.type] || "⚠️"}</span>
                            <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{e.title}</span>
                            {severityBadge(e.severity)}
                            {statusBadge(e.status)}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            📍 {e.city} · 📅 {e.date} · 👥 {e.victims} vítimas
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
