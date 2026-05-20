import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../utils/geocoding.js";
import { mockPoints } from "../../data/points";
import { useNavigate } from "react-router-dom";
import { haversine } from "../../utils/geo.js";

function MapaDoacoes({ flyToCoords }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-45.5557, -23.0320],
      zoom: 13,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("style.load", () => {
      mockPoints.forEach(p => {
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#FF6B1A;border:2px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;box-shadow:0 0 12px rgba(255,107,26,0.5)">📦</div>`;
        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([p.lng, p.lat])
          .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(
            `<strong style="color:#eef0f5">${p.name}</strong><br/>
             <span style="color:#7a8099;font-size:11px">${p.address}</span><br/>
             <span style="color:#4a5068;font-size:10px">${p.items.join(", ")}</span>`
          ))
          .addTo(map);
      });
    });

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (mapRef.current && flyToCoords) {
      mapRef.current.flyTo({ center: [flyToCoords[1], flyToCoords[0]], zoom: 15, duration: 1200 });
    }
  }, [flyToCoords]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ flex: 1, borderRadius: 10, background: "#111318", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#4a5068", fontSize: 12 }}>
          Configure VITE_MAPBOX_TOKEN para visualizar o mapa.
        </div>
      </div>
    );
  }

  return <div style={{ flex: 1, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }} ref={containerRef} />;
}

export default function DoadoresForm() {
  const [tipo,          setTipo]          = useState("");
  const [pontoInput,    setPontoInput]    = useState("");
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [flyToCoords,   setFlyToCoords]   = useState(null);
  const [localizando,   setLocalizando]   = useState(false);

  const navigate = useNavigate();

  const sugestoes = mockPoints.filter(p =>
    p.name.toLowerCase().includes(pontoInput.toLowerCase())
  );

  function handleMaisProximo() {
    if (!navigator.geolocation) { alert("Seu navegador não suporta geolocalização."); return; }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const maisProximo = mockPoints.reduce((melhor, ponto) => {
          const dist = haversine(latitude, longitude, ponto.lat, ponto.lng);
          return dist < melhor.dist ? { ponto, dist } : melhor;
        }, { ponto: mockPoints[0], dist: Infinity }).ponto;

        setPontoInput(maisProximo.name);
        setFlyToCoords([maisProximo.lat, maisProximo.lng]);
        setLocalizando(false);
      },
      () => { alert("Não foi possível obter sua localização."); setLocalizando(false); }
    );
  }

  const inp = {
    background: "#181c23",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 6,
    padding: "8px 12px",
    color: "#eef0f5",
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
  };

  const lbl = {
    fontSize: 11,
    color: "#7a8099",
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
        .d-inp::placeholder { color: #4a5068; }
        .d-inp option { background: #181c23; }
        .d-sug:hover { background: rgba(255,107,26,0.08) !important; }
        .d-prox:hover { border-color: #FF6B1A !important; color: #FF6B1A !important; }
        .mapboxgl-ctrl-group { background: #1a1f2e !important; border: 1px solid rgba(255,255,255,0.07) !important; border-radius: 8px !important; }
        .mapboxgl-ctrl-group button { background: #1a1f2e !important; border-bottom: 1px solid rgba(255,255,255,0.07) !important; }
        .mapboxgl-ctrl-group button:hover { background: #1e2330 !important; }
        .mapboxgl-popup-content { background: #181c23; color: #eef0f5; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 10px 12px; font-family: 'Inter', sans-serif; font-size: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.5); }
        .mapboxgl-popup-tip { border-top-color: #181c23 !important; border-bottom-color: #181c23 !important; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#0a0c10", fontFamily: "'Inter', sans-serif" }}>

        {/* ── Painel lateral do formulário ── */}
        <div style={{ width: 420, minWidth: 420, background: "#111318", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "32px 28px", overflowY: "auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.16em", color: "#FF6B1A", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, fontWeight: 500 }}>
              RECURSOS · LOGÍSTICA
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#eef0f5", margin: 0, fontFamily: "'Syne', sans-serif" }}>
              Nova Doação
            </h2>
            <div style={{ fontSize: 11, color: "#4a5068", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              Formulário público · sem cadastro necessário
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 20 }} />

          {/* Form */}
          <form style={{ flex: 1, display: "flex", flexDirection: "column" }} onSubmit={e => e.preventDefault()}>

            <label style={{ ...lbl, marginTop: 0 }}>Nome</label>
            <input className="d-inp" type="text" placeholder="Seu nome completo" style={inp} />

            <label style={lbl}>Telefone</label>
            <input className="d-inp" type="text" placeholder="(00) 00000-0000" style={inp} />

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

            <label style={lbl}>Destino da Carga</label>
            <div style={{ position: "relative" }}>
              <input
                className="d-inp"
                type="text"
                placeholder="Ponto de entrega"
                value={pontoInput}
                onChange={e => { setPontoInput(e.target.value); setShowSugestoes(true); }}
                style={inp}
                onFocus={() => setShowSugestoes(true)}
                onBlur={() => setTimeout(() => setShowSugestoes(false), 150)}
              />
              {showSugestoes && sugestoes.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#181c23", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, zIndex: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                  {sugestoes.map(p => (
                    <div key={p.id}
                      className="d-sug"
                      onMouseDown={() => { setPontoInput(p.name); setFlyToCoords([p.lat, p.lng]); setShowSugestoes(false); }}
                      style={{ padding: "9px 12px", color: "#eef0f5", cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      📦 {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className="d-prox" onClick={handleMaisProximo} disabled={localizando}
              style={{ marginTop: 10, padding: "8px 12px", background: "#181c23", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, color: "#7a8099", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: localizando ? "wait" : "pointer", letterSpacing: "0.04em", textAlign: "left", transition: "all 0.15s" }}>
              {localizando ? "📡 Localizando..." : "◉ Usar ponto mais próximo"}
            </button>

            <div style={{ flex: 1 }} />

            <button type="submit"
              style={{ marginTop: 24, padding: "11px 0", background: "#FF6B1A", border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#ff7d33"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,107,26,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FF6B1A"; e.currentTarget.style.boxShadow = "none"; }}>
              Registrar Doação
            </button>
          </form>

          <button onClick={() => navigate("/login")}
            style={{ marginTop: 16, background: "none", border: "none", color: "#4a5068", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em", padding: 0, textAlign: "left", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#7a8099"}
            onMouseLeave={e => e.currentTarget.style.color = "#4a5068"}>
            ← Voltar ao início
          </button>
        </div>

        {/* ── Mapa ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.16em", color: "#FF6B1A", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, fontWeight: 500 }}>
                MAPA · TAUBATÉ, SP
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#eef0f5", fontFamily: "'Syne', sans-serif" }}>
                Pontos de Coleta
              </div>
            </div>
            <span style={{ fontSize: 10, color: "#4a5068", fontFamily: "'JetBrains Mono', monospace", marginTop: 6 }}>
              {mockPoints.length} pontos ativos
            </span>
          </div>
          <MapaDoacoes flyToCoords={flyToCoords} />
        </div>

      </div>
    </>
  );
}
