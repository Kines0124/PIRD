import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";

const PERFIS = [
  {
    id: "defesa",
    label: "Defesa Civil",
    desc: "Comando e controle de operações",
    cor: "#de393f",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    id: "especialista",
    label: "Especialista",
    desc: "Painel e convocações ativas",
    cor: "#3d9be9",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    id: "ponto",
    label: "Ponto de Coleta",
    desc: "Gestão de estoque e doações",
    cor: "#de393f",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
];

const LINKS = [
  { to: "/form",                label: "Fazer uma doação" },
  { to: "/pontos-coleta/novo",  label: "Cadastrar ponto de coleta" },
  { to: "/especialistas/cadastro", label: "Cadastrar como especialista" },
];

export default function TelaLogin({ onLogin }) {
  const navigate = useNavigate();
  const btnRefs = useRef([]);

  function handleCardClick(p, i) {
    if (p.id === "ponto") { navigate("/pontos-coleta"); return; }
    const btn = btnRefs.current[i];
    if (!btn) return;
    gsap.timeline({
      onComplete: () => {
        if (p.id === "especialista") navigate("/especialistas/painel");
        else onLogin(p.id);
      },
    })
      .to(btn, { scale: 0.93, duration: 0.12, ease: "power2.in" })
      .to(btn, { scale: 1,    duration: 0.5,  ease: "elastic.out(1, 0.5)" });
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-body)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background depth layers */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: [
          "radial-gradient(ellipse 700px 500px at 12% 18%, rgba(41,60,90,0.45), transparent)",
          "radial-gradient(ellipse 500px 400px at 88% 82%, rgba(222,57,63,0.07), transparent)",
        ].join(", "),
      }} />

      {/* Dot grid */}
      <div className="dot-bg" style={{ position: "fixed", inset: 0, pointerEvents: "none" }} />

      {/* Diagonal accent stripe */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 3,
        background: "linear-gradient(90deg, var(--red) 0%, var(--navy) 60%, transparent 100%)",
        pointerEvents: "none",
        zIndex: 10,
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 860,
        padding: "40px 24px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        {/* ── Status badge ── */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 999,
          padding: "6px 16px",
          marginBottom: 40,
        }}>
          <span style={{
            display: "block", width: 7, height: 7, borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 8px #22c55e",
            animation: "pulse-dot 2s ease-in-out infinite",
          }} />
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--text-muted)", letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}>
            Taubaté, SP
          </span>
        </div>

        {/* ── Wordmark ── */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 88,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            lineHeight: 0.92,
            margin: "0 0 14px",
          }}>BASE</h1>

          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-muted)",
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            margin: "0 0 22px",
          }}>
            Plataforma Integrada de Resposta a Desastres
          </p>

        </div>

        {/* ── Profile buttons ── */}
        <div style={{
          display: "flex", gap: 14, justifyContent: "center",
          flexWrap: "wrap", marginBottom: 44,
          width: "100%",
        }}>
          {PERFIS.map((p, i) => (
            <button
              key={p.id}
              ref={el => { btnRefs.current[i] = el; }}
              onClick={() => handleCardClick(p, i)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                gap: 16,
                padding: "22px 24px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                cursor: "pointer",
                width: 210,
                transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                textAlign: "left",
              }}
              onMouseEnter={() => {
                const btn = btnRefs.current[i];
                gsap.to(btn, { y: -4, duration: 0.2 });
                btn.style.borderColor = `${p.cor}55`;
                btn.style.background = "var(--bg-elevated)";
                btn.style.boxShadow = `0 12px 32px rgba(0,0,0,0.35)`;
              }}
              onMouseLeave={() => {
                const btn = btnRefs.current[i];
                gsap.to(btn, { y: 0, duration: 0.2 });
                btn.style.borderColor = "var(--border)";
                btn.style.background = "var(--bg-surface)";
                btn.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: `${p.cor}16`,
                border: `1px solid ${p.cor}2a`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: p.cor,
              }}>
                {p.icon}
              </div>
              <div>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17, fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: 5,
                  lineHeight: 1,
                }}>
                  {p.label}
                </div>
                <div style={{
                  fontSize: 12, color: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  lineHeight: 1.4,
                }}>
                  {p.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Quick links ── */}
        <div style={{
          display: "flex", gap: 28, justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {LINKS.map(lk => (
            <Link
              key={lk.to}
              to={lk.to}
              style={{
                color: "var(--text-muted)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                textDecoration: "none",
                letterSpacing: "0.08em",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              {lk.label} →
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pulse-dot { 0%,100%{opacity:1;box-shadow:0 0 8px #22c55e} 50%{opacity:0.7;box-shadow:0 0 14px #22c55e} }
      `}</style>
    </div>
  );
}
