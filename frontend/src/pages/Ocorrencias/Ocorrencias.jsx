import { useState } from "react";
import DetalheOcorrencia from "./DetalheOcorrencia";
import FormNovoEvento from "./FormNovoEvento";
import Tag from "../../components/Tag";
import { mockEvents } from "../../data/events";
import { severityColor, severityLabel, statusColor } from "../../constants/theme";

export default function Ocorrencias({ perfil }) {
  const [sel, setSel]         = useState(null);
  const [showForm, setShowForm] = useState(false);

  if (sel) return <DetalheOcorrencia evento={sel} perfil={perfil} onVoltar={() => setSel(null)} />;

  const isDefesa = perfil === "defesa";

  return (
    <div className="dot-bg" style={{ padding: "28px 32px" }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-end", marginBottom: 24,
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: isDefesa ? "var(--red)" : "var(--blue-info)",
            letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 5,
          }}>
            Módulo
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 30, fontWeight: 800,
            color: "var(--text-primary)", margin: 0,
            letterSpacing: "0.02em",
          }}>
            Ocorrências
          </h1>
        </div>

        {isDefesa && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: showForm ? "rgba(222,57,63,0.15)" : "var(--red)",
              border: showForm ? "1px solid rgba(222,57,63,0.3)" : "none",
              borderRadius: "var(--radius)",
              padding: "10px 20px",
              color: showForm ? "var(--red)" : "#fff",
              fontWeight: 700, fontSize: 13,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {showForm ? "✕ Fechar" : "+ Nova Ocorrência"}
          </button>
        )}
      </div>

      {showForm && <FormNovoEvento onFechar={() => setShowForm(false)} />}

      {/* ── Mini-mapa SVG ── */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden", marginBottom: 20,
      }}>
        <div style={{
          padding: "12px 18px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between",
        }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11,
            color: "var(--text-muted)", letterSpacing: "0.16em", textTransform: "uppercase",
          }}>
            Mapa — Taubaté, SP
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--blue-info)",
          }}>
            23°01′S 45°33′O
          </span>
        </div>

        <div style={{
          height: 200, background: "var(--bg-base)",
          position: "relative", overflow: "hidden",
        }}>
          <svg width="100%" height="100%" viewBox="0 0 700 200" style={{ position: "absolute", inset: 0 }}>
            <line x1="0"   y1="66"  x2="700" y2="66"  stroke="var(--border)" strokeWidth="1.5"/>
            <line x1="0"   y1="132" x2="700" y2="132" stroke="var(--border)" strokeWidth="1.5"/>
            <line x1="120" y1="0"   x2="120" y2="200" stroke="var(--border)" strokeWidth="1.5"/>
            <line x1="280" y1="0"   x2="280" y2="200" stroke="var(--border)" strokeWidth="1.5"/>
            <line x1="430" y1="0"   x2="430" y2="200" stroke="var(--border)" strokeWidth="1"/>
            <line x1="580" y1="0"   x2="580" y2="200" stroke="var(--border)" strokeWidth="1"/>
            <path d="M0,145 Q80,130 150,145 Q220,158 300,138 Q380,118 450,132 Q530,148 700,128"
              stroke="rgba(61,155,233,0.2)" strokeWidth="7" fill="none"/>
            <text x="20"  y="52"  fill="var(--text-muted)" fontSize="9" fontFamily="monospace">ESTORIL</text>
            <text x="160" y="44"  fill="var(--text-muted)" fontSize="9" fontFamily="monospace">CENTRO</text>
            <text x="460" y="52"  fill="var(--text-muted)" fontSize="9" fontFamily="monospace">JD. NAÇÕES</text>
            <text x="135" y="105" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">M. CRUZEIRO</text>
            <text x="55"  y="158" fill="rgba(61,155,233,0.35)" fontSize="8" fontFamily="monospace">Rio Una</text>
          </svg>
          {[
            { left: "16%", top: "35%", cor: "#de393f", label: "Alagamento Estoril",    anim: "1.5s" },
            { left: "38%", top: "20%", cor: "#f97316", label: "Desliz. Cruzeiro",      anim: "2s"   },
            { left: "65%", top: "48%", cor: "#f5c518", label: "Inundação Jd. Nações",  anim: "2.5s" },
          ].map((p, i) => (
            <div key={i} style={{
              position: "absolute", left: p.left, top: p.top,
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                background: p.cor, boxShadow: `0 0 12px ${p.cor}`,
                animation: `pulse-event ${p.anim} infinite`,
              }} />
              <div style={{
                fontSize: 8, color: p.cor, marginTop: 3,
                background: "rgba(12,26,39,0.9)",
                padding: "1px 5px", borderRadius: 3,
                whiteSpace: "nowrap",
                border: `1px solid ${p.cor}28`,
                fontFamily: "var(--font-mono)",
              }}>
                {p.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lista de eventos ── */}
      <div style={{ display: "grid", gap: 10 }}>
        {mockEvents.map(ev => (
          <div
            key={ev.id}
            onClick={() => setSel(ev)}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "18px 22px", cursor: "pointer",
              display: "grid", gridTemplateColumns: "auto 1fr auto",
              gap: 16, alignItems: "center",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${severityColor[ev.severity]}35`;
              e.currentTarget.style.background = "var(--bg-elevated)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--bg-surface)";
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${severityColor[ev.severity]}14`,
              border: `1px solid ${severityColor[ev.severity]}28`,
              color: severityColor[ev.severity],
              fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13,
            }}>
              S{ev.severity}
            </div>

            <div>
              <div style={{
                display: "flex", alignItems: "center",
                gap: 10, marginBottom: 6,
              }}>
                <h3 style={{
                  fontSize: 15, fontWeight: 700,
                  color: "var(--text-primary)", margin: 0,
                }}>
                  {ev.title}
                </h3>
                <Tag color={statusColor[ev.status]}>{ev.status}</Tag>
              </div>
              <div style={{
                fontSize: 12, color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
              }}>
                {ev.desc.slice(0, 90)}...
              </div>
              <div style={{
                fontSize: 11, color: "var(--text-muted)",
                marginTop: 4, fontFamily: "var(--font-mono)",
              }}>
                📅 {ev.date} · 📍 {ev.lat.toFixed(3)}, {ev.lng.toFixed(3)}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 20, fontWeight: 800,
                color: severityColor[ev.severity],
                lineHeight: 1,
              }}>
                {severityLabel[ev.severity]}
              </div>
              <div style={{
                fontSize: 11, color: "var(--text-muted)",
                marginTop: 4, fontFamily: "var(--font-mono)",
              }}>
                Ver detalhes ›
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse-event {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.5; transform:scale(1.4); }
        }
      `}</style>
    </div>
  );
}
