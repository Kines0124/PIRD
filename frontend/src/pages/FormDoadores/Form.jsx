import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../utils/geocoding.js";
import { useNavigate } from "react-router-dom";
import { maskPhone } from "../../utils/cpfValidator.js";
import { CATEGORIA_CONFIG, SUBITENS_POR_CATEGORIA } from "../PontoColeta/shared";

const BASE = "http://localhost:8080";

const CATEGORIAS_ORDER = ['solido', 'liquido', 'dormitorios', 'roupas', 'higiene_limpeza'];

function placeMarkersOnMap(map, markersRef, pontosList) {
  markersRef.current.forEach(m => m.remove());
  markersRef.current = [];
  (pontosList || []).forEach(p => {
    if (!p.lat || !p.lng) return;
    const el = document.createElement('div');
    el.style.cssText = 'width:12px;height:12px;background:#FF6B1A;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 4px rgba(255,107,26,0.25);cursor:pointer';
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([p.lng, p.lat])
      .addTo(map);
    markersRef.current.push(marker);
  });
}

function MapaDoacoes({ flyToCoords, pontos, height }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const pontosRef    = useRef(pontos);
  pontosRef.current  = pontos;

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-45.5557, -23.0320],
      zoom: 13, pitch: 45, antialias: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("style.load", () => {
      const layers = map.getStyle().layers;
      const labelLayer = layers.find(l => l.type === "symbol" && l.layout?.["text-field"]);
      map.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#aaa",
          "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
          "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
          "fill-extrusion-opacity": 0.6,
        },
      }, labelLayer?.id);
    });
    map.on("load", () => {
      placeMarkersOnMap(map, markersRef, pontosRef.current);
    });
    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    placeMarkersOnMap(map, markersRef, pontos);
  }, [pontos]);

  useEffect(() => {
    if (mapRef.current && flyToCoords) {
      mapRef.current.flyTo({ center: [flyToCoords.lng, flyToCoords.lat], zoom: 15, duration: 1200 });
    }
  }, [flyToCoords]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ height: height || "100%", borderRadius: 10, background: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
          Configure VITE_MAPBOX_TOKEN para visualizar o mapa.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height: height || "100%", borderRadius: 10, overflow: "hidden", border: "1px solid #334155" }}
    />
  );
}

export default function DoadoresForm() {
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

  const categoriaDemanda = categoriaFiltro
    ? demandas.find(d => d.categoria === categoriaFiltro)
    : null;

  const subItens = categoriaDemanda
    ? (SUBITENS_POR_CATEGORIA[categoriaFiltro] || [])
    : [];

  const canSubmit = nome.trim() && telefone.trim() && categoriaDemanda && subItemSel && quantidade && parseInt(quantidade) >= 1;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
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
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: "8px 12px",
    color: "#e2e8f0",
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
  };

  const lbl = {
    fontSize: 11,
    color: "#94a3b8",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 5,
    marginTop: 14,
    fontFamily: "'Inter', sans-serif",
    display: "block",
    fontWeight: 600,
  };

  const selectedPonto = pontos.find(p => p.id === parseInt(pontoId));

  if (sucesso) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center", padding: "48px 32px", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Doação registrada!</h2>
          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Sua doação foi registrada com sucesso. Leve os itens ao ponto de coleta selecionado e informe seu nome ao responsável.
          </p>
          <button onClick={() => navigate("/login")}
            style={{ padding: "10px 24px", background: "#FF6B1A", border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        .d-inp:focus { border-color: #FF6B1A !important; }
        .d-inp::placeholder { color: #475569; }
        .mapboxgl-ctrl-group { background: #fff !important; border: 1px solid #e2e8f0 !important; border-radius: 8px !important; }
        .mapboxgl-ctrl-group button { background: #fff !important; border-bottom: 1px solid #e2e8f0 !important; }
        .mapboxgl-ctrl-group button:hover { background: #f8fafc !important; }

        /* ── Responsive ── */
        .doadores-root {
          display: flex;
          min-height: 100vh;
          background: #0f172a;
          font-family: 'Inter', sans-serif;
        }

        /* Desktop: side-by-side */
        @media (min-width: 768px) {
          .doadores-sidebar {
            width: 420px;
            min-width: 420px;
            border-right: 1px solid #1e293b;
            display: flex;
            flex-direction: column;
            padding: 32px 28px;
            overflow-y: auto;
          }
          .doadores-map-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 32px 28px;
          }
          .mapa-toggle-btn { display: none !important; }
          .mapa-mobile-wrapper { display: none !important; }
          .mapa-desktop-wrapper { display: flex !important; }
        }

        /* Mobile: stacked */
        @media (max-width: 767px) {
          .doadores-root { flex-direction: column; }
          .doadores-sidebar {
            width: 100%;
            min-width: unset;
            border-right: none;
            border-bottom: 1px solid #1e293b;
            padding: 24px 20px;
            display: flex;
            flex-direction: column;
          }
          .doadores-map-area {
            display: none !important;
          }
          .mapa-toggle-btn { display: flex !important; }
          .mapa-mobile-wrapper { display: block !important; }
          .mapa-desktop-wrapper { display: none !important; }
        }
      `}</style>

      <div className="doadores-root">

        {/* ── Painel lateral / formulário ── */}
        <div className="doadores-sidebar" style={{ background: "#0f172a" }}>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.16em", color: "#FF6B1A", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, fontWeight: 500 }}>
              RECURSOS · LOGÍSTICA
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "'Syne', sans-serif" }}>
              Nova Doação
            </h2>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              Formulário público · sem cadastro necessário
            </div>
          </div>

          {/* Botão toggle do mapa — só aparece no mobile */}
          <button
            className="mapa-toggle-btn"
            type="button"
            onClick={() => setMapaVisivel(v => !v)}
            style={{
              display: "none", // sobrescrito pelo CSS
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              marginBottom: 20,
              padding: "9px 14px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#94a3b8",
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            <span>🗺️ {mapaVisivel ? "Ocultar mapa" : "Ver pontos de coleta no mapa"}</span>
            <span style={{ fontSize: 10, color: "#475569" }}>{mapaVisivel ? "▲" : "▼"}</span>
          </button>

          {/* Mapa inline — só aparece no mobile quando visível */}
          <div
            className="mapa-mobile-wrapper"
            style={{
              display: "none", // sobrescrito pelo CSS
              marginBottom: mapaVisivel ? 20 : 0,
              overflow: "hidden",
              maxHeight: mapaVisivel ? 260 : 0,
              transition: "max-height 0.3s ease",
            }}
          >
            {selectedPonto && (
              <div style={{ fontSize: 11, color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
                📍 {selectedPonto.name}
              </div>
            )}
            <MapaDoacoes flyToCoords={flyToCoords} pontos={pontos} height="240px" />
          </div>

          <div style={{ height: 1, background: "#1e293b", marginBottom: 20 }} />

          <form style={{ flex: 1, display: "flex", flexDirection: "column" }} onSubmit={handleSubmit}>

            <label style={{ ...lbl, marginTop: 0 }}>Nome</label>
            <input className="d-inp" type="text" placeholder="Seu nome completo" style={inp}
              value={nome} onChange={e => setNome(e.target.value)} />

            <label style={lbl}>Telefone</label>
            <input className="d-inp" type="text" inputMode="numeric" placeholder="(11) 99999-9999"
              value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))} style={inp} />

            <label style={lbl}>Ponto de Coleta</label>
            <select className="d-inp" value={pontoId} onChange={e => setPontoId(e.target.value)}
              style={{ ...inp, cursor: "pointer", appearance: "none" }}>
              <option value="">Selecione o ponto…</option>
              {pontos.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.city || p.address}</option>
              ))}
            </select>

            {pontoId && demandasLoading && (
              <div style={{ marginTop: 14, fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                Carregando categorias…
              </div>
            )}

            {pontoId && !demandasLoading && (
              <>
                <label style={lbl}>Categoria</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {CATEGORIAS_ORDER.map(cat => {
                    const cfg    = CATEGORIA_CONFIG[cat];
                    const temDem = demandas.some(d => d.categoria === cat);
                    const ativo  = categoriaFiltro === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        disabled={!temDem}
                        onClick={() => { setCategoriaFiltro(cat); setSubItemSel(""); }}
                        style={{
                          padding: "5px 13px",
                          borderRadius: 20,
                          border: `1px solid ${ativo ? "#FF6B1A" : temDem ? "#334155" : "#1e293b"}`,
                          background: ativo ? "rgba(255,107,26,0.15)" : "transparent",
                          color: ativo ? "#FF6B1A" : temDem ? "#94a3b8" : "#2d3748",
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                          cursor: temDem ? "pointer" : "not-allowed",
                          transition: "all 0.15s",
                          letterSpacing: "0.04em",
                          opacity: temDem ? 1 : 0.35,
                        }}
                      >
                        {cfg?.label || cat}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {categoriaFiltro && !categoriaDemanda && !demandasLoading && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(100,116,139,0.08)", border: "1px solid #1e293b", borderRadius: 6, color: "#475569", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                Nenhuma demanda cadastrada nessa categoria.
              </div>
            )}

            {categoriaFiltro && categoriaDemanda && (
              <>
                <label style={lbl}>Item</label>
                <select className="d-inp" value={subItemSel} onChange={e => setSubItemSel(e.target.value)}
                  style={{ ...inp, cursor: "pointer", appearance: "none" }}>
                  <option value="">Selecione o item…</option>
                  {subItens.map(sub => {
                    const unit = CATEGORIA_CONFIG[categoriaFiltro]?.unit || 'un';
                    const restantes = Math.max(0, categoriaDemanda.quantidadeDemanda - categoriaDemanda.quantidadeRecebida);
                    return (
                      <option key={sub} value={sub}>
                        {sub} ({restantes} {unit} restantes na categoria)
                      </option>
                    );
                  })}
                </select>
              </>
            )}

            {subItemSel && (
              <>
                <label style={lbl}>Quantidade</label>
                <input className="d-inp" type="number" inputMode="numeric" placeholder="0" min="1"
                  value={quantidade} onChange={e => setQuantidade(e.target.value.replace(/\D/g, ""))}
                  style={{ ...inp, MozAppearance: "textfield" }} />
              </>
            )}

            {erro && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, color: "#ef4444", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                {erro}
              </div>
            )}

            <div style={{ flex: 1 }} />

            <button type="submit" disabled={!canSubmit || submitting}
              style={{
                marginTop: 24, padding: "11px 0",
                background: canSubmit ? "#FF6B1A" : "#334155",
                border: "none", borderRadius: 6,
                color: canSubmit ? "#fff" : "#64748b",
                fontWeight: 700, fontFamily: "'Inter', sans-serif", fontSize: 13,
                letterSpacing: "0.06em", cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "all 0.15s", textTransform: "uppercase",
              }}
              onMouseEnter={e => { if (canSubmit) { e.currentTarget.style.background = "#ff7d33"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,107,26,0.25)"; } }}
              onMouseLeave={e => { if (canSubmit) { e.currentTarget.style.background = "#FF6B1A"; e.currentTarget.style.boxShadow = "none"; } }}>
              {submitting ? "Registrando…" : "Registrar Doação"}
            </button>
          </form>

          <button onClick={() => navigate("/login")}
            style={{ marginTop: 16, background: "none", border: "none", color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em", padding: 0, textAlign: "left", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
            onMouseLeave={e => e.currentTarget.style.color = "#64748b"}>
            ← Voltar ao início
          </button>
        </div>

        {/* ── Mapa (desktop only) ── */}
        <div className="doadores-map-area mapa-desktop-wrapper" style={{ background: "#0f172a", display: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.16em", color: "#FF6B1A", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, fontWeight: 500 }}>
                MAPA · TAUBATÉ, SP
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Syne', sans-serif" }}>
                Pontos de Coleta
              </div>
            </div>
            {selectedPonto && (
              <span style={{ fontSize: 11, color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", marginTop: 6 }}>
                📍 {selectedPonto.name}
              </span>
            )}
          </div>
          <MapaDoacoes flyToCoords={flyToCoords} pontos={pontos} />
        </div>

      </div>
    </>
  );
}