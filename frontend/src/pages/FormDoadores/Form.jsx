import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../utils/geocoding.js";
import { useNavigate } from "react-router-dom";
import { maskPhone } from "../../utils/cpfValidator.js";
import { useGeocodingAutocomplete } from "../../hooks/useGeocodingAutocomplete.js";

// ── Mapa light-mode ───────────────────────────────────────────────────────────

function MapaDoacoes({ flyToCoords }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

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
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (mapRef.current && flyToCoords) {
      mapRef.current.flyTo({ center: [flyToCoords.lng, flyToCoords.lat], zoom: 15, duration: 1200 });
    }
  }, [flyToCoords]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ flex: 1, borderRadius: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
          Configure VITE_MAPBOX_TOKEN para visualizar o mapa.
        </div>
      </div>
    );
  }

  return <div style={{ flex: 1, borderRadius: 10, overflow: "hidden", border: "1px solid #334155" }} ref={containerRef} />;
}

// ── Formulário principal ──────────────────────────────────────────────────────

export default function DoadoresForm() {
  const [tipo,       setTipo]       = useState("");
  const [telefone,   setTelefone]   = useState("");
  const [destinoQuery, setDestinoQuery] = useState("");
  const [destinoSel,   setDestinoSel]  = useState(null);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [flyToCoords,  setFlyToCoords]   = useState(null);

  const navigate = useNavigate();

  const { sugestoes, carregando } = useGeocodingAutocomplete(showSugestoes ? destinoQuery : "");

  function handleDestinoSelect(sug) {
    setDestinoQuery(sug.placeName);
    setDestinoSel(sug);
    setFlyToCoords(sug.coordenadas);
    setShowSugestoes(false);
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        .d-inp:focus { border-color: #FF6B1A !important; }
        .d-inp::placeholder { color: #475569; }
        .d-sug:hover { background: rgba(255,107,26,0.08) !important; }
        .d-prox:hover { border-color: #FF6B1A !important; color: #FF6B1A !important; }
        .mapboxgl-ctrl-group { background: #fff !important; border: 1px solid #e2e8f0 !important; border-radius: 8px !important; }
        .mapboxgl-ctrl-group button { background: #fff !important; border-bottom: 1px solid #e2e8f0 !important; }
        .mapboxgl-ctrl-group button:hover { background: #f8fafc !important; }
        .mapboxgl-popup-content { background: #fff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-family: 'Inter', sans-serif; font-size: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .mapboxgl-popup-tip { border-top-color: #fff !important; border-bottom-color: #fff !important; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>

        {/* ── Painel lateral ── */}
        <div style={{ width: 420, minWidth: 420, background: "#0f172a", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: "32px 28px", overflowY: "auto" }}>

          {/* Header */}
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

          <div style={{ height: 1, background: "#1e293b", marginBottom: 20 }} />

          {/* Form */}
          <form style={{ flex: 1, display: "flex", flexDirection: "column" }} onSubmit={e => e.preventDefault()}>

            <label style={{ ...lbl, marginTop: 0 }}>Nome</label>
            <input className="d-inp" type="text" placeholder="Seu nome completo" style={inp} />

            <label style={lbl}>Telefone</label>
            <input
              className="d-inp"
              type="text"
              inputMode="numeric"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={e => setTelefone(maskPhone(e.target.value))}
              style={inp}
            />

            <label style={lbl}>Categoria de Item</label>
            <select className="d-inp" onChange={e => setTipo(e.target.value)} style={{ ...inp, cursor: "pointer", appearance: "none" }}>
              <option value="">Selecione o tipo</option>
              <option value="Alimento">Alimento (Sólido)</option>
              <option value="Bebida">Bebida (Líquido)</option>
            </select>

            <label style={lbl}>Descrição do Item</label>
            <input className="d-inp" type="text" placeholder="Ex: Arroz, Feijão, Água mineral..." style={inp} />

            <label style={lbl}>Volume / Quantidade</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="d-inp" type="number" placeholder="0"
                style={{ ...inp, flex: 2, MozAppearance: "textfield" }} />
              <select className="d-inp" style={{ ...inp, flex: 1, cursor: "pointer", appearance: "none" }}>
                {tipo === "Bebida" ? (
                  <>
                    <option value="L">L</option>
                    <option value="ml">ML</option>
                  </>
                ) : (
                  <>
                    <option value="kg">KG</option>
                    <option value="g">G</option>
                    <option value="un">UN</option>
                  </>
                )}
              </select>
            </div>

            {/* Destino da carga — autocomplete real via Mapbox */}
            <label style={lbl}>Destino da Carga</label>
            <div style={{ position: "relative" }}>
              <input
                className="d-inp"
                type="text"
                placeholder="Buscar endereço ou ponto de entrega..."
                value={destinoQuery}
                onChange={e => { setDestinoQuery(e.target.value); setDestinoSel(null); setShowSugestoes(true); }}
                onFocus={() => setShowSugestoes(true)}
                onBlur={() => setTimeout(() => setShowSugestoes(false), 150)}
                style={{ ...inp, borderColor: destinoSel ? "#22c55e" : "#334155" }}
              />
              {carregando && (
                <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94a3b8" }}>…</div>
              )}
              {showSugestoes && sugestoes.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1e293b", border: "1px solid #334155", borderRadius: 6, zIndex: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                  {sugestoes.map(s => (
                    <div key={s.id}
                      className="d-sug"
                      onMouseDown={() => handleDestinoSelect(s)}
                      style={{ padding: "9px 12px", color: "#e2e8f0", cursor: "pointer", fontSize: 12, fontFamily: "'Inter', sans-serif", borderBottom: "1px solid #334155" }}>
                      <div style={{ fontWeight: 600 }}>{s.shortName}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{s.placeName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }} />

            <button type="submit"
              style={{ marginTop: 24, padding: "11px 0", background: "#FF6B1A", border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#ff7d33"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,107,26,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FF6B1A"; e.currentTarget.style.boxShadow = "none"; }}>
              Registrar Doação
            </button>
          </form>

          <button onClick={() => navigate("/login")}
            style={{ marginTop: 16, background: "none", border: "none", color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em", padding: 0, textAlign: "left", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
            onMouseLeave={e => e.currentTarget.style.color = "#64748b"}>
            ← Voltar ao início
          </button>
        </div>

        {/* ── Mapa ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 28px", background: "#0f172a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.16em", color: "#FF6B1A", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, fontWeight: 500 }}>
                MAPA · TAUBATÉ, SP
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Syne', sans-serif" }}>
                Pontos de Coleta
              </div>
            </div>
            {destinoSel && (
              <span style={{ fontSize: 11, color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", marginTop: 6 }}>
                📍 {destinoSel.shortName}
              </span>
            )}
          </div>
          <MapaDoacoes flyToCoords={flyToCoords} />
        </div>

      </div>
    </>
  );
}
