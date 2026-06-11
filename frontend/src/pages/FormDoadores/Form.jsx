import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../utils/geocoding.js";
import { useNavigate } from "react-router-dom";
import { maskPhone } from "../../utils/cpfValidator.js";
import { CATEGORIA_CONFIG, SUBITENS_POR_CATEGORIA } from "../PontoColeta/shared";
import { FcOk }         from "react-icons/fc";
import { FaMapMarkedAlt } from "react-icons/fa";

const BASE = "http://localhost:8080";
const CATEGORIAS_ORDER = ['solido', 'liquido', 'dormitorios', 'roupas', 'higiene_limpeza'];

// ── Markers ────────────────────────────────────────────────────────────────────
// Guarda referência ao elemento DOM de cada marker para o GSAP poder animá-lo
function placeMarkersOnMap(map, markersRef, markerElsRef, pontosList) {
  markersRef.current.forEach(m => m.remove());
  markersRef.current  = [];
  markerElsRef.current = [];

  (pontosList || []).forEach((p, i) => {
    if (!p.lat || !p.lng) return;

    const el = document.createElement('div');
    el.style.cssText = 'width:12px;height:12px;background:#de393f;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 4px rgba(222,57,63,0.25);cursor:pointer';

    // Começa invisível — o GSAP vai animar a entrada
    gsap.set(el, { scale: 0, opacity: 0 });

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([p.lng, p.lat])
      .addTo(map);

    markersRef.current.push(marker);
    markerElsRef.current.push({ el, id: p.id });

    // Pulse de entrada em stagger: cada marker aparece com bounce após o anterior
    gsap.to(el, {
      scale: 1, opacity: 1,
      duration: 0.45,
      ease: "back.out(2)",
      delay: 0.15 + i * 0.07,
    });
  });
}

// ── Mapa ───────────────────────────────────────────────────────────────────────
function MapaDoacoes({ flyToCoords, pontos, height, selectedPontoId }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markersRef    = useRef([]);
  const markerElsRef  = useRef([]);   // { el, id }[]
  const pontosRef     = useRef(pontos);
  pontosRef.current   = pontos;

  // Fade-in do container do mapa
  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { scale: 0.98, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.55, ease: "power2.out", delay: 0.2 }
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-45.5557, -23.0320],
      zoom: 14, pitch: 45, antialias: true,
    });
    mapRef.current = map;
    const mapEl = containerRef.current;
    const preventScroll = e => e.preventDefault();
    mapEl.addEventListener("touchmove", preventScroll, { passive: false });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("style.load", () => {
      const layers     = map.getStyle().layers;
      const labelLayer = layers.find(l => l.type === "symbol" && l.layout?.["text-field"]);
      map.addLayer({
        id: "3d-buildings", source: "composite", "source-layer": "building",
        filter: ["==", "extrude", "true"], type: "fill-extrusion", minzoom: 15,
        paint: {
          "fill-extrusion-color": "#aaa",
          "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
          "fill-extrusion-base":   ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
          "fill-extrusion-opacity": 0.6,
        },
      }, labelLayer?.id);
    });
    map.on("load", () => {
      placeMarkersOnMap(map, markersRef, markerElsRef, pontosRef.current);
    });
    return () => {
      mapEl.removeEventListener("touchmove", preventScroll);
      markersRef.current.forEach(m => m.remove());
      markersRef.current   = [];
      markerElsRef.current = [];
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Reposiciona markers quando a lista muda
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    placeMarkersOnMap(map, markersRef, markerElsRef, pontos);
  }, [pontos]);

  // flyTo + highlight no marker selecionado
  useEffect(() => {
    if (mapRef.current && flyToCoords) {
      mapRef.current.flyTo({ center: [flyToCoords.lng, flyToCoords.lat], zoom: 15, duration: 1200 });
    }
  }, [flyToCoords]);

  useEffect(() => {
    if (!selectedPontoId) return;
    const found = markerElsRef.current.find(m => m.id === parseInt(selectedPontoId));
    if (!found) return;
    // Bounce de highlight: cresce, volta, com leve glow
    gsap.timeline()
      .to(found.el, { scale: 2.2, duration: 0.2, ease: "power2.out" })
      .to(found.el, { scale: 1,   duration: 0.5, ease: "elastic.out(1, 0.4)" });
  }, [selectedPontoId]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ height: height || "100%", borderRadius: "var(--radius-lg)", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
          Configure VITE_MAPBOX_TOKEN para visualizar o mapa.
        </div>
      </div>
    );
  }

  return <div ref={containerRef} style={{ height: height || "100%", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)", touchAction: "none" }} />;
}

// ── Tela de sucesso ────────────────────────────────────────────────────────────
function SuccessScreen({ onVoltar }) {
  const containerRef = useRef(null);
  const iconRef      = useRef(null);

  useGSAP(() => {
    gsap.set(".sc-row", { y: 16, opacity: 0 });

    // Ícone entra com bounce (igual ao especialista aprovado)
    gsap.fromTo(iconRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)", delay: 0.2 }
    );

    // Linhas sobem em stagger depois do ícone
    gsap.to(".sc-row", {
      y: 0, opacity: 1,
      duration: 0.4, ease: "power2.out",
      stagger: 0.08, delay: 0.5,
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-base)", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body)" }}
    >
      <div className="dot-bg" style={{ position: "fixed", inset: 0, pointerEvents: "none" }} />
      <div style={{ position: "relative", textAlign: "center", padding: "48px 32px", maxWidth: 440 }}>
        {/* Ícone com bounce */}
        <div
          ref={iconRef}
          style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 20px" }}
        >
          <FcOk />
        </div>

        <h2 className="sc-row" style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "0.02em" }}>
          Doação registrada!
        </h2>
        <p className="sc-row" style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Sua doação foi registrada com sucesso. Leve os itens ao ponto de coleta selecionado e informe seu nome ao responsável.
        </p>
        <div className="sc-row">
          <button onClick={onVoltar} className="pird-btn-primary">
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Formulário principal ───────────────────────────────────────────────────────
export default function DoadoresForm() {
  const containerRef = useRef(null);
  const sidebarRef   = useRef(null);
  const submitBtnRef = useRef(null);

  const [nome,            setNome]            = useState("");
  const [telefone,        setTelefone]        = useState("");
  const [quantidade,      setQuantidade]      = useState("");
  const [pontos,          setPontos]          = useState([]);
  const [pontoId,         setPontoId]         = useState("");
  const [demandas,        setDemandas]        = useState([]);
  const [demandasLoading, setDemandasLoading] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [subItemSel,      setSubItemSel]      = useState("");
  const [flyToCoords,     setFlyToCoords]     = useState(null);
  const [submitting,      setSubmitting]      = useState(false);
  const [sucesso,         setSucesso]         = useState(false);
  const [erro,            setErro]            = useState(null);
  const [mapaVisivel,     setMapaVisivel]     = useState(true);

  const navigate = useNavigate();

  // ── Animação de entrada da sidebar ────────────────────────────────────────
  useGSAP(() => {
    gsap.set(".df-row", { y: 14, opacity: 0 });
    gsap.to(".df-row", {
      y: 0, opacity: 1,
      duration: 0.4, ease: "power2.out",
      stagger: 0.065, delay: 0.25,
    });
  }, { scope: containerRef });

  // ── Anima novos campos quando aparecem ────────────────────────────────────
  // Categorias aparecem ao selecionar ponto
  const categoriasRef = useRef(null);
  useEffect(() => {
    if (!pontoId || demandasLoading || !categoriasRef.current) return;
    gsap.fromTo(categoriasRef.current,
      { y: 10, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.3, ease: "power2.out" }
    );
  }, [pontoId, demandasLoading]);

  // Subitem aparece ao selecionar categoria
  const subitemRef = useRef(null);
  useEffect(() => {
    if (!categoriaFiltro || !subitemRef.current) return;
    gsap.fromTo(subitemRef.current,
      { y: 10, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.3, ease: "power2.out" }
    );
  }, [categoriaFiltro]);

  // Quantidade aparece ao selecionar subitem
  const quantidadeRef = useRef(null);
  useEffect(() => {
    if (!subItemSel || !quantidadeRef.current) return;
    gsap.fromTo(quantidadeRef.current,
      { y: 10, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.3, ease: "power2.out" }
    );
  }, [subItemSel]);

  // ── Fetch pontos ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/pontos-coleta/validados`)
      .then(r => r.ok ? r.json() : [])
      .then(setPontos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!pontoId) { setDemandas([]); setSubItemSel(""); setCategoriaFiltro(""); return; }
    const ponto = pontos.find(p => p.id === parseInt(pontoId));
    if (ponto?.lat && ponto?.lng) setFlyToCoords({ lat: ponto.lat, lng: ponto.lng });
    setDemandasLoading(true);
    fetch(`${BASE}/pontos-coleta/${pontoId}/demandas`)
      .then(r => r.ok ? r.json() : [])
      .then(setDemandas)
      .catch(() => {})
      .finally(() => setDemandasLoading(false));
    setSubItemSel("");
    setCategoriaFiltro("");
  }, [pontoId]);

  const categoriaDemanda = categoriaFiltro ? demandas.find(d => d.categoria === categoriaFiltro) : null;
  const subItens         = categoriaDemanda ? (SUBITENS_POR_CATEGORIA[categoriaFiltro] || []) : [];
  const canSubmit        = nome.trim() && telefone.trim() && categoriaDemanda && subItemSel && quantidade && parseInt(quantidade) >= 1;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    // Bounce no botão antes de enviar
    gsap.timeline()
      .to(submitBtnRef.current, { scale: 0.95, duration: 0.08 })
      .to(submitBtnRef.current, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });

    setSubmitting(true);
    setErro(null);
    try {
      const res = await fetch(`${BASE}/doacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeDoador:    nome.trim(),
          contatoDoador: telefone,
          demandaId:     categoriaDemanda.id,
          descricaoItem: subItemSel,
          quantidade:    parseInt(quantidade),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSucesso(true);
    } catch {
      setErro("Erro ao registrar doação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const inp = {
    background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: "10px 14px",
    color: "var(--text-primary)", outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "var(--font-body)", fontSize: 13,
    width: "100%", boxSizing: "border-box",
  };

  const lbl = {
    fontSize: 10, color: "var(--text-muted)",
    letterSpacing: "0.16em", textTransform: "uppercase",
    marginBottom: 5, marginTop: 16,
    fontFamily: "var(--font-mono)", display: "block", fontWeight: 500,
  };

  const selectedPonto = pontos.find(p => p.id === parseInt(pontoId));

  if (sucesso) return <SuccessScreen onVoltar={() => navigate("/login")} />;

  return (
    <>
      <style>{`
        .d-inp:focus { border-color: var(--red) !important; box-shadow: 0 0 0 3px var(--red-dim) !important; }
        .d-inp::placeholder { color: var(--text-muted); }
        .mapboxgl-ctrl-group { background: var(--bg-elevated) !important; border: 1px solid var(--border) !important; border-radius: 8px !important; }
        .mapboxgl-ctrl-group button { background: var(--bg-elevated) !important; border-bottom: 1px solid var(--border) !important; }
        .mapboxgl-ctrl-group button:hover { background: var(--bg-hover) !important; }
        .doadores-root { display: flex; min-height: 100vh; background-color: var(--bg-base); font-family: var(--font-body); }
        @media (min-width: 768px) {
          .doadores-sidebar { width: 420px; min-width: 420px; border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 32px 28px; overflow-y: auto; }
          .doadores-map-area { flex: 1; display: flex; flex-direction: column; padding: 32px 28px; }
          .mapa-toggle-btn { display: none !important; }
          .mapa-mobile-wrapper { display: none !important; }
          .mapa-desktop-wrapper { display: flex !important; }
        }
        @media (max-width: 767px) {
          .doadores-root { flex-direction: column; }
          .doadores-sidebar { width: 100%; min-width: unset; border-right: none; border-bottom: 1px solid var(--border); padding: 24px 20px; display: flex; flex-direction: column; }
          .doadores-map-area { display: none !important; }
          .mapa-toggle-btn { display: flex !important; }
          .mapa-mobile-wrapper { display: block !important; }
          .mapa-desktop-wrapper { display: none !important; }
        }
      `}</style>

      <div ref={containerRef} className="doadores-root dot-bg">

        {/* ── Sidebar ── */}
        <div ref={sidebarRef} className="doadores-sidebar dot-bg" style={{ backgroundColor: "var(--bg-surface)" }}>

          {/* Faixa top */}
          <div className="df-row" style={{ height: 3, marginBottom: 28, background: "linear-gradient(90deg, var(--red), transparent)", borderRadius: 2 }} />

          {/* Título */}
          <div className="df-row" style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.2em", color: "var(--red)", marginBottom: 8, fontWeight: 500, textTransform: "uppercase" }}>
              Recursos · Logística
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "0.02em" }}>
              Nova Doação
            </h2>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
              Formulário público · sem cadastro necessário
            </div>
          </div>

          {/* Toggle mapa mobile */}
          <button className="df-row mapa-toggle-btn" type="button" onClick={() => setMapaVisivel(v => !v)}
            style={{ display: "none", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 20, padding: "9px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)", cursor: "pointer", letterSpacing: "0.04em" }}>
            <span><FaMapMarkedAlt /> {mapaVisivel ? "Ocultar mapa" : "Ver pontos de coleta no mapa"}</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{mapaVisivel ? "▲" : "▼"}</span>
          </button>

          {/* Mapa mobile */}
          <div className="mapa-mobile-wrapper" style={{ display: "none", marginBottom: mapaVisivel ? 20 : 0, overflow: "hidden", maxHeight: mapaVisivel ? 260 : 0, transition: "max-height 0.3s ease" }}>
            {selectedPonto && (
              <div style={{ fontSize: 11, color: "var(--success)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
                📍 {selectedPonto.name}
              </div>
            )}
            <MapaDoacoes flyToCoords={flyToCoords} pontos={pontos} height="240px" selectedPontoId={pontoId} />
          </div>

          <div className="df-row" style={{ height: 1, background: "var(--border)", marginBottom: 20 }} />

          <form style={{ flex: 1, display: "flex", flexDirection: "column" }} onSubmit={handleSubmit}>

            <div className="df-row">
              <label style={{ ...lbl, marginTop: 0 }}>Nome</label>
              <input className="d-inp" type="text" placeholder="Seu nome completo" style={inp}
                value={nome} onChange={e => setNome(e.target.value)} />
            </div>

            <div className="df-row">
              <label style={lbl}>Telefone</label>
              <input className="d-inp" type="text" inputMode="numeric" placeholder="(11) 99999-9999"
                value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))} style={inp} />
            </div>

            <div className="df-row">
              <label style={lbl}>Ponto de Coleta</label>
              <select className="d-inp" value={pontoId} onChange={e => setPontoId(e.target.value)}
                style={{ ...inp, cursor: "pointer", appearance: "none" }}>
                <option value="">Selecione o ponto…</option>
                {pontos.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.city || p.address}</option>
                ))}
              </select>
            </div>

            {pontoId && demandasLoading && (
              <div style={{ marginTop: 14, fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                Carregando categorias…
              </div>
            )}

            {pontoId && !demandasLoading && (
              <div ref={categoriasRef}>
                <label style={lbl}>Categoria</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {CATEGORIAS_ORDER.map(cat => {
                    const cfg    = CATEGORIA_CONFIG[cat];
                    const temDem = demandas.some(d => d.categoria === cat);
                    const ativo  = categoriaFiltro === cat;
                    return (
                      <button key={cat} type="button" disabled={!temDem}
                        onClick={() => { setCategoriaFiltro(cat); setSubItemSel(""); }}
                        style={{
                          padding: "5px 13px", borderRadius: 20,
                          border: `1px solid ${ativo ? "rgba(222,57,63,0.5)" : temDem ? "var(--border)" : "transparent"}`,
                          background: ativo ? "var(--red-dim)" : "transparent",
                          color: ativo ? "var(--red)" : temDem ? "var(--text-secondary)" : "var(--text-muted)",
                          fontSize: 11, fontFamily: "var(--font-mono)",
                          cursor: temDem ? "pointer" : "not-allowed",
                          transition: "all 0.15s", letterSpacing: "0.06em",
                          opacity: temDem ? 1 : 0.35,
                        }}>
                        {cfg?.label || cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {categoriaFiltro && !categoriaDemanda && !demandasLoading && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(100,116,139,0.08)", border: "1px solid #1e293b", borderRadius: 6, color: "#475569", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                Nenhuma demanda cadastrada nessa categoria.
              </div>
            )}

            {categoriaFiltro && categoriaDemanda && (
              <div ref={subitemRef}>
                <label style={lbl}>Item</label>
                <select className="d-inp" value={subItemSel} onChange={e => setSubItemSel(e.target.value)}
                  style={{ ...inp, cursor: "pointer", appearance: "none" }}>
                  <option value="">Selecione o item…</option>
                  {subItens.map(sub => {
                    const unit      = CATEGORIA_CONFIG[categoriaFiltro]?.unit || 'un';
                    const restantes = Math.max(0, categoriaDemanda.quantidadeDemanda - categoriaDemanda.quantidadeRecebida);
                    return (
                      <option key={sub} value={sub}>
                        {sub} ({restantes} {unit} restantes na categoria)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {subItemSel && (
              <div ref={quantidadeRef}>
                <label style={lbl}>Quantidade</label>
                <input className="d-inp" type="number" inputMode="numeric" placeholder="0" min="1"
                  value={quantidade} onChange={e => setQuantidade(e.target.value.replace(/\D/g, ""))}
                  style={{ ...inp, MozAppearance: "textfield" }} />
              </div>
            )}

            {erro && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--red-dim)", border: "1px solid rgba(222,57,63,0.3)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                {erro}
              </div>
            )}

            <div style={{ flex: 1 }} />

            <div className="df-row">
              <button
                ref={submitBtnRef}
                type="submit"
                disabled={!canSubmit || submitting}
                style={{
                  marginTop: 24, padding: "12px 0",
                  background: canSubmit ? "var(--red)" : "var(--bg-elevated)",
                  border: "none", borderRadius: "var(--radius)",
                  color: canSubmit ? "#fff" : "var(--text-muted)",
                  fontWeight: 700, fontFamily: "var(--font-body)", fontSize: 13,
                  letterSpacing: "0.06em", cursor: canSubmit ? "pointer" : "not-allowed",
                  transition: "all 0.15s", textTransform: "uppercase", width: "100%",
                }}
                onMouseEnter={e => { if (canSubmit) { e.currentTarget.style.background = "var(--red-hover)"; e.currentTarget.style.boxShadow = "0 0 20px var(--red-glow)"; } }}
                onMouseLeave={e => { if (canSubmit) { e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.boxShadow = "none"; } }}
              >
                {submitting ? "Registrando…" : "Registrar Doação"}
              </button>
            </div>
          </form>

          <button onClick={() => navigate("/login")}
            style={{ marginTop: 16, background: "none", border: "none", color: "var(--text-muted)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", padding: 0, textAlign: "left", transition: "color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}>
            ← Voltar ao início
          </button>
        </div>

        {/* ── Mapa desktop ── */}
        <div className="doadores-map-area mapa-desktop-wrapper" style={{ background: "var(--bg-base)", display: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 6, fontWeight: 500, textTransform: "uppercase" }}>
                Mapa · Taubaté, SP
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.02em" }}>
                Pontos de Coleta
              </div>
            </div>
            {selectedPonto && (
              <span style={{ fontSize: 11, color: "var(--success)", fontFamily: "var(--font-mono)", marginTop: 6 }}>
                📍 {selectedPonto.name}
              </span>
            )}
          </div>
          <MapaDoacoes flyToCoords={flyToCoords} pontos={pontos} selectedPontoId={pontoId} />
        </div>

      </div>
    </>
  );
}