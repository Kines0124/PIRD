import { Link, useLocation } from "react-router-dom";
import { mockEvents } from "../data/events";
import { mockDemands } from "../data/demands";
import { mockVolunteers } from "../data/volunteers";

const NAV_DEFESA = [
  { to: "/app/dashboard",   icon: "▦", label: "Dashboard" },
  { to: "/app/ocorrencias", icon: "◈", label: "Ocorrências" },
  { to: "/app/pontos",      icon: "◉", label: "Pontos de Coleta" },
  { to: "/app/portal",      icon: "◐", label: "Portal Doador" },
];

const NAV_USUARIO = [
  { to: "/app/dashboard",   icon: "▦", label: "Dashboard" },
  { to: "/app/pontos",      icon: "◉", label: "Pontos de Coleta" },
  { to: "/app/ocorrencias", icon: "◈", label: "Ocorrências" },
  { to: "/app/portal",      icon: "◑", label: "Quero Ajudar" },
];

export default function Sidebar({ perfil }) {
  const { pathname } = useLocation();

  const items = perfil === "defesa" ? NAV_DEFESA : NAV_USUARIO;
  const isDefesa = perfil === "defesa";
  const accent = isDefesa ? "var(--red)" : "var(--blue-info)";
  const accentHex = isDefesa ? "#de393f" : "#3d9be9";

  const ea = mockEvents.length;
  const du = mockDemands.filter(d => d.priority >= 4).length;
  const va = mockVolunteers.filter(v => v.available).length;

  return (
    <aside style={{
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      width: 228,
      minHeight: "100vh",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── Logo ── */}
      <div style={{
        padding: "22px 20px 18px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: accentHex,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: 20, color: "#fff", letterSpacing: "0.02em",
            }}>P</span>
          </div>
          <div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800, fontSize: 20,
              color: "var(--text-primary)",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}>BASE</div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9,
              color: "var(--text-muted)",
              letterSpacing: "0.2em", textTransform: "uppercase",
              marginTop: 2,
            }}>Taubaté · SP</div>
          </div>
        </div>

        <div style={{
          background: `${accentHex}12`,
          border: `1px solid ${accentHex}28`,
          borderRadius: 7,
          padding: "6px 10px",
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: accentHex, flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 9,
            color: accentHex, fontWeight: 500,
            letterSpacing: "0.14em", textTransform: "uppercase",
          }}>
            {isDefesa ? "Defesa Civil" : "Cidadão"}
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9,
          color: "var(--text-muted)", letterSpacing: "0.2em",
          textTransform: "uppercase",
          padding: "6px 12px 8px",
        }}>
          Navegação
        </div>
        {items.map(item => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: "none",
                transition: "all 0.15s",
                background: active ? `${accentHex}14` : "transparent",
                borderLeft: active ? `2px solid ${accentHex}` : "2px solid transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                fontFamily: "var(--font-body)",
              }}
            >
              <span style={{
                fontSize: 12,
                color: active ? accentHex : "var(--text-muted)",
                opacity: active ? 1 : 0.5,
              }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Status mini-panel ── */}
      <div style={{ padding: "0 14px 20px" }}>
        <div style={{
          background: "var(--bg-elevated)",
          borderRadius: 10,
          padding: "12px 14px",
          border: "1px solid var(--border)",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 9,
            color: "var(--text-muted)", letterSpacing: "0.16em",
            textTransform: "uppercase", marginBottom: 10,
          }}>
            Status Operacional
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            {[
              { v: ea, l: "Eventos",    c: "var(--danger)" },
              { v: du, l: "Urgentes",   c: "#f97316"       },
              { v: va, l: "Voluntários", c: "var(--success)" },
            ].map(k => (
              <div key={k.l} style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22, fontWeight: 800,
                  color: k.c, lineHeight: 1,
                }}>{k.v}</div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 8,
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em", marginTop: 3,
                }}>{k.l}</div>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 8,
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--text-muted)", textAlign: "center",
          }}>
            Defesa Civil:{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>199</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
