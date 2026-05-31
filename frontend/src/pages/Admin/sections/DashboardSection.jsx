import { useMemo } from "react";

const TIPO_COLOR = {
  enchente:          "#0EA5E9",
  deslizamento:      "#7C3AED",
  alagamento:        "#0369A1",
  incendio:          "#DC2626",
  desabamento:       "#64748B",
  acidente_transito: "#F97316",
  intoxicacao:       "#059669",
  outro:             "#F43F5E",
};

const SEVERITY_COLOR = { critico: "#dc2626", alto: "#ea580c", medio: "#ca8a04", baixo: "#16a34a" };

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

export default function DashboardSection({ events, criticalPoints, collectionPoints, specialists, volunteers }) {
  const ativos    = events.filter(e => e.status === "ativo");
  const criticos  = ativos.filter(e => e.severity === "critico").length;
  const pendVals  = specialists.filter(s => s.status === "pendente").length;
  const pendCols  = collectionPoints.filter(p => p.status === "pendente").length;

  const today = new Date(); today.setHours(0,0,0,0);
  const aprovadosHoje = specialists.filter(s => s.status === "aprovado" && s.revisadoEm && new Date(s.revisadoEm) >= today).length;

  const stats = [
    { label: "Eventos Ativos",       value: ativos.length,        icon: "🚨", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
    { label: "Eventos Críticos",     value: criticos,             icon: "🔴", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
    { label: "Pontos Críticos",      value: criticalPoints.length, icon: "⚠️", color: "#ea580c", bg: "rgba(234,88,12,0.08)" },
  ];

  const countByTipo = useMemo(() => {
    const map = {};
    ativos.forEach(e => { map[e.type] = (map[e.type] || 0) + 1; });
    return Object.entries(map).map(([tipo, count]) => ({ tipo, count }));
  }, [ativos]);

  const recentes = useMemo(() =>
    [...ativos].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5),
  [ativos]);

  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Dashboard</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Visão geral do sistema</div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Donut por tipo */}
        <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>Eventos por Tipo</div>
          {countByTipo.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum evento ativo</div>
          ) : (() => {
            const total = countByTipo.reduce((s, x) => s + x.count, 0);
            const R = 74; const circ = 2 * Math.PI * R;
            let acc = 0;
            const segs = countByTipo.map(({ tipo, count }) => {
              const len = (count / total) * circ; const off = acc; acc += len;
              return { tipo, count, len, off, color: TIPO_COLOR[tipo] ?? "#9ca3af" };
            });
            return (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                <div style={{ position: "relative", width: 200, height: 200 }}>
                  <svg viewBox="0 0 200 200" width="200" height="200" style={{ transform: "rotate(-90deg)", display: "block" }}>
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--bg-hover)" strokeWidth="28" />
                    {segs.map(seg => (
                      <circle key={seg.tipo} cx="100" cy="100" r={R} fill="none" stroke={seg.color} strokeWidth="28"
                        strokeDasharray={`${seg.len - 2} ${circ}`} strokeDashoffset={-seg.off} strokeLinecap="butt" />
                    ))}
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{total}</span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>eventos</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", width: "100%" }}>
                  {segs.map(seg => (
                    <div key={seg.tipo} style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, backgroundColor: seg.color }} />
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seg.tipo}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>{seg.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Recentes */}
        <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>Eventos Recentes</div>
          {recentes.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum evento</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentes.map(e => (
                <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", backgroundColor: "var(--bg-hover)", borderRadius: 8, borderLeft: `3px solid ${SEVERITY_COLOR[e.severity] || "#666"}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{e.type}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{timeAgo(e.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Criticidade */}
      <div style={{ marginTop: 16, backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>Distribuição por Severidade</div>
        <div style={{ display: "flex", gap: 16 }}>
          {[["critico","🔴 Crítico"],["alto","🟠 Alto"],["medio","🟡 Médio"],["baixo","🟢 Baixo"]].map(([s, lbl]) => {
            const count = ativos.filter(e => e.severity === s).length;
            return (
              <div key={s} style={{ flex: 1, textAlign: "center", padding: 16, backgroundColor: "var(--bg-hover)", borderRadius: 10, borderTop: `3px solid ${SEVERITY_COLOR[s]}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: SEVERITY_COLOR[s] }}>{count}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{lbl}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
