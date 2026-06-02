import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const BASE          = "http://localhost:8080";
const POLL_INTERVAL = 15000;

export default function PendingScreen() {
  const containerRef = useRef(null);
  const cardRef      = useRef(null);
  const ring1Ref     = useRef(null);
  const ring2Ref     = useRef(null);
  const ring3Ref     = useRef(null);
  const liveDotRef   = useRef(null);

  const [status,       setStatus]       = useState("pendente");
  const [especialista, setEspecialista] = useState(null);

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = sessionStorage.getItem("pird_registro_id");
    if (!id) return;

    async function poll() {
      try {
        const res  = await fetch(`${BASE}/especialistas/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status)      setStatus(data.status);
        if (data)             setEspecialista(data);
      } catch { /* ignora erros de rede */ }
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // ── Cores por status ───────────────────────────────────────────────────────
  const isAprovado  = status === "aprovado";
  const isReprovado = status === "reprovado";

  const color    = isAprovado ? "#22c55e" : isReprovado ? "#ef4444" : "#F5C518";
  const colorRGB = isAprovado ? "34,197,94" : isReprovado ? "239,68,68" : "245,197,24";

  const icon  = isAprovado ? "✅" : isReprovado ? "❌" : "⏳";
  const label = isAprovado ? "Cadastro aprovado!" : isReprovado ? "Cadastro não aprovado" : "Cadastro em análise";
  const msg   = isAprovado
    ? "Parabéns! Seu cadastro foi aprovado. Você já pode ser convocado em situações de emergência."
    : isReprovado
    ? "Infelizmente seu cadastro não foi aprovado neste momento. Entre em contato com a Defesa Civil para mais informações."
    : "Seu cadastro foi recebido pela equipe da Defesa Civil e será analisado em breve.";

  // ── Animações GSAP ─────────────────────────────────────────────────────────
  useGSAP(() => {
    gsap.set(cardRef.current, { scale: 0.97, opacity: 0 });
    gsap.set(".ps-row",       { y: 14, opacity: 0 });
    gsap.set(".ps-data-row",  { x: -10, opacity: 0 });

    const tl = gsap.timeline({ delay: 0.4 });
    tl.to(cardRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" })
      .to(".ps-row",       { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.07 }, "-=0.2")
      .to(".ps-data-row",  { x: 0, opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.06 }, "-=0.3");

    const rings   = [ring1Ref.current, ring2Ref.current, ring3Ref.current];
    const pulseTl = gsap.timeline({ repeat: -1 });
    rings.forEach((ring, i) => {
      pulseTl.fromTo(ring,
        { scale: 1, opacity: 0.55 - i * 0.12 },
        { scale: 3.2, opacity: 0, duration: 2.4, ease: "power1.out" },
        i * 0.7
      );
    });

    gsap.to(liveDotRef.current, {
      opacity: 0.3, duration: 1.2,
      ease: "sine.inOut", yoyo: true, repeat: -1,
    });
  }, { scope: containerRef });

  useGSAP(() => {
    if (status === "pendente") return;

    gsap.killTweensOf([ring1Ref.current, ring2Ref.current, ring3Ref.current, liveDotRef.current]);
    gsap.set([ring1Ref.current, ring2Ref.current, ring3Ref.current], { opacity: 0 });

    // Bounce no ícone
    gsap.fromTo(".ps-status-icon",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
    );
  }, { scope: containerRef, dependencies: [status] });

  // ── Dados a exibir no card ─────────────────────────────────────────────────
  const dataRows = [
    { label: "Nome",       value: especialista?.nome             || "—" },
    { label: "CPF",        value: especialista?.cpf              || "—" },
    { label: "Profissão",  value: especialista?.profissao        || "—" },
    { label: "Registro",   value: especialista?.numeroRegistro   || "—" },
    { label: "Telefone",   value: especialista?.telefone         || "—" },
    { label: "E-mail",     value: especialista?.email            || "—" },
    { label: "Cidade",     value: especialista?.cidade           || "—" },
    { label: "Status",     value: label },
  ];

  // ── Estilos compartilhados ─────────────────────────────────────────────────
  const monoSm = { fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" };

  return (
    <div
      ref={containerRef}
      className="dot-bg"
      style={{ minHeight: "100dvh", backgroundColor: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}
    >
      {/* Logo */}
      <div className="ps-row" style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
          <img src="/resources/logo.png" alt="BASE" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 10 }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>BASE</span>
        </div>
      </div>

      {/* Card principal */}
      <div
        ref={cardRef}
        style={{ width: "100%", maxWidth: 460, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "36px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}
      >
        {/* Header do card */}
        <div className="ps-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, ...monoSm, color: "var(--text-muted)" }}>
          <span>BASE · Especialista</span>
          <span>Status: {isAprovado ? "Aprovado" : isReprovado ? "Reprovado" : "Pendente"}</span>
        </div>

        {/* Ícone com rings de pulso */}
        <div className="ps-row" style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{ position: "relative", width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Rings */}
            {[ring1Ref, ring2Ref, ring3Ref].map((ref, i) => (
              <div key={i} ref={ref} style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                border: `1.5px solid ${color}`,
                opacity: 0.55 - i * 0.12,
              }} />
            ))}
            {/* Core */}
            <div div className="ps-status-icon" style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${colorRGB},0.18), rgba(${colorRGB},0.04))`,
              border: `1px solid rgba(${colorRGB},0.35)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, position: "relative", zIndex: 1,
            }}>
              {icon}
            </div>
          </div>
        </div>

        {/* Título e mensagem */}
        <div className="ps-row" style={{ textAlign: "center", marginBottom: 8 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.02em" }}>
            {label}
          </h2>
        </div>
        <div className="ps-row" style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: 360, margin: "0 auto 28px" }}>
          {msg}
        </div>

        {/* Card de dados */}
        <div className="ps-row" style={{ marginBottom: 20 }}>
          <div style={{ ...monoSm, color: "var(--text-muted)", marginBottom: 10 }}>Dados enviados</div>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "4px 16px" }}>
            {dataRows.map(({ label: l, value }) => (
              <div key={l} className="ps-data-row" style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
                // remove borda do último
                ref={el => { if (el && el === el.parentElement?.lastElementChild) el.style.borderBottom = "none"; }}
              >
                <span style={{ ...monoSm, fontSize: 10, color: "var(--text-muted)" }}>{l}</span>
                <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, maxWidth: 240, textAlign: "right", wordBreak: "break-word" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé do card */}
        <div className="ps-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          {status === "pendente" ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...monoSm, color: "var(--text-muted)" }}>
              <span ref={liveDotRef} style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 0 3px rgba(${colorRGB},0.18)`, flexShrink: 0 }} />
              Monitorando em tempo real
            </div>
          ) : (
            /* ref precisa existir mesmo quando não é pendente para o gsap não quebrar */
            <span ref={liveDotRef} style={{ opacity: 0 }} />
          )}

          {status !== "pendente" && (
            <a
              href="/login"
              style={{ padding: "10px 22px", borderRadius: 9, background: "var(--accent)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em" }}
            >
              Ir para o início
            </a>
          )}
        </div>
      </div>

      {/* Coordenadas */}
      <div className="ps-row" style={{ marginTop: 18, ...monoSm, color: "var(--text-secondary)", opacity: 0.18 }}>
        23°01&apos;S &nbsp; 45°33&apos;W &nbsp;—&nbsp; TAUBATÉ · SP
      </div>
    </div>
  );
}