const SEVERITY_COLORS = {
  critico: { bg: "rgba(220,38,38,0.1)",  text: "#dc2626", label: "🔴 Crítico",  dot: "#dc2626" },
  alto:    { bg: "rgba(234,88,12,0.1)",  text: "#ea580c", label: "🟠 Alto",     dot: "#ea580c" },
  medio:   { bg: "rgba(202,138,4,0.1)",  text: "#ca8a04", label: "🟡 Médio",    dot: "#ca8a04" },
  baixo:   { bg: "rgba(22,163,74,0.1)",  text: "#16a34a", label: "🟢 Baixo",    dot: "#16a34a" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export default function AlertaCard({ evento, onEncerrar }) {
  const crit = SEVERITY_COLORS[evento.severity] || SEVERITY_COLORS.medio;

  return (
    <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderLeft: `3px solid ${crit.dot}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 3 }}>{evento.title}</div>
          {(evento.address || evento.city) && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>📍 {evento.address || evento.city}</div>
          )}
        </div>
        <span style={{ backgroundColor: crit.bg, color: crit.text, borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "3px 8px", whiteSpace: "nowrap" }}>{crit.label}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)", borderRadius: 6, fontSize: 11, padding: "2px 8px" }}>{evento.type}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 11, alignSelf: "center" }}>⏱ {timeAgo(evento.date)}</span>
      </div>

      {evento.neededProfiles && evento.neededProfiles.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {evento.neededProfiles.map(p => (
            <span key={p} style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#dc2626", borderRadius: 6, fontSize: 11, padding: "2px 7px", border: "1px solid rgba(220,38,38,0.2)" }}>{p}</span>
          ))}
        </div>
      )}

      {onEncerrar && evento.status === "ativo" && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => onEncerrar(evento.id)} style={{ backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 12, padding: "5px 12px", cursor: "pointer" }}>
            Encerrar
          </button>
        </div>
      )}
    </div>
  );
}
