import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../utils/geocoding.js";
import { mockPoints } from "../../data/points";
import { mockEvents } from "../../data/events";
import { severityColor } from "../../constants/theme";
import { haversine, formatDist } from "../../utils/geo";

// ─── Mapa Mapbox ──────────────────────────────────────────────────────────────
function MapView({ selectedPoint, userPos }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-45.5606, -23.0319],
      zoom: 13,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("style.load", () => {
      mockPoints.forEach(p => {
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#de393f;border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;box-shadow:0 0 12px rgba(222,57,63,0.5)">📦</div>`;
        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([p.lng, p.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<b>${p.name}</b><br/>${p.address}<br/><small>${p.items.join(", ")}</small>`))
          .addTo(map);
      });
    });

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
    if (userPos) {
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:16px;height:16px;border-radius:50%;background:#3d9be9;border:3px solid #fff;box-shadow:0 0 10px #3d9be9;"></div>`;
      userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([userPos.lng, userPos.lat])
        .setPopup(new mapboxgl.Popup().setHTML("<b>📍 Sua localização</b>"))
        .addTo(mapRef.current);
    }
  }, [userPos]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedPoint) {
      mapRef.current.flyTo({ center: [selectedPoint.lng, selectedPoint.lat], zoom: 15, duration: 1000 });
    } else if (userPos) {
      mapRef.current.flyTo({ center: [userPos.lng, userPos.lat], zoom: 14, duration: 1000 });
    }
  }, [selectedPoint, userPos]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{
        height: 420,
        background: "var(--bg-elevated)",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
      }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🗺️</div>
          <div style={{ fontSize: 12 }}>Configure VITE_MAPBOX_TOKEN para visualizar o mapa.</div>
        </div>
      </div>
    );
  }

  return <div style={{ height: 420, borderRadius: "var(--radius-lg)", overflow: "hidden" }} ref={containerRef} />;
}

// ─── PontosColeta ─────────────────────────────────────────────────────────────
export default function PontosColeta({ perfil }) {
  const [pontSel, setPontSel]                 = useState(null);
  const [userPos, setUserPos]                 = useState(null);
  const [geoStatus, setGeoStatus]             = useState(null);
  const [pontosOrdenados, setPontosOrdenados] = useState(mockPoints);

  function buscarLocalizacao() {
    if (!navigator.geolocation) { setGeoStatus("erro"); return; }
    setGeoStatus("buscando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        setGeoStatus("ok");
        const comDistancia = mockPoints.map(p => ({
          ...p,
          distReal: haversine(latitude, longitude, p.lat, p.lng),
        })).sort((a, b) => a.distReal - b.distReal);
        setPontosOrdenados(comDistancia);
      },
      () => setGeoStatus("erro"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const isDefesa = perfil === "defesa";

  return (
    /* dot-bg obrigatório para telas de Pontos de Coleta */
    <div className="dot-bg" style={{ padding: "28px 32px", minHeight: "100%" }}>

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
            Pontos de Coleta
          </h1>
        </div>

        {isDefesa && (
          <button style={{
            background: "var(--red)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "10px 20px",
            color: "#fff",
            fontWeight: 700, fontSize: 13,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--red-hover)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--red)"; }}
          >
            + Cadastrar Ponto
          </button>
        )}
      </div>

      {/* ── Cards dos pontos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {pontosOrdenados.map((p, idx) => {
          const isSelected = pontSel?.id === p.id;
          const isNearest  = geoStatus === "ok" && idx === 0;
          return (
            <div
              key={p.id}
              onClick={() => setPontSel(prev => prev?.id === p.id ? null : p)}
              style={{
                background: isSelected ? "var(--bg-elevated)" : "var(--bg-surface)",
                border: `1px solid ${isNearest ? "#22c55e" : isSelected ? "var(--blue-info)" : "var(--border)"}`,
                borderRadius: "var(--radius-lg)",
                padding: 18,
                transition: "all 0.2s",
                cursor: "pointer",
                boxShadow: isSelected
                  ? "0 0 18px rgba(61,155,233,0.15)"
                  : isNearest
                  ? "0 0 14px rgba(34,197,94,0.12)"
                  : "none",
                position: "relative",
              }}
              onMouseEnter={e => {
                if (!isSelected) e.currentTarget.style.borderColor = "rgba(61,155,233,0.4)";
              }}
              onMouseLeave={e => {
                if (!isSelected) e.currentTarget.style.borderColor = isNearest ? "#22c55e" : "var(--border)";
              }}
            >
              {isNearest && (
                <div style={{
                  position: "absolute", top: -10, left: 14,
                  background: "#22c55e", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  padding: "2px 9px", borderRadius: 10,
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-mono)",
                }}>
                  ★ MAIS PRÓXIMO
                </div>
              )}

              <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: 10,
              }}>
                <span style={{
                  background: p.type === "Fixo" ? "rgba(61,155,233,0.12)" : "rgba(139,92,246,0.12)",
                  color: p.type === "Fixo" ? "var(--blue-info)" : "#8b5cf6",
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 20,
                  border: `1px solid ${p.type === "Fixo" ? "rgba(61,155,233,0.25)" : "rgba(139,92,246,0.25)"}`,
                  fontFamily: "var(--font-mono)",
                }}>
                  {p.type}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: geoStatus === "ok" ? "#22c55e" : "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {geoStatus === "ok" && p.distReal !== undefined ? formatDist(p.distReal) : p.dist || "—"}
                </span>
              </div>

              <div style={{
                fontSize: 14, fontWeight: 700,
                color: "var(--text-primary)", marginBottom: 5,
              }}>
                {p.name}
              </div>

              <div style={{
                fontSize: 12, color: "var(--text-muted)", marginBottom: 10,
                fontFamily: "var(--font-body)",
              }}>
                📍 {p.address}
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 9,
                  color: "var(--text-muted)", letterSpacing: "0.16em",
                  textTransform: "uppercase", marginBottom: 6,
                }}>
                  E.A — Eventos Ativos
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.events.map(eid => {
                    const ev = mockEvents.find(e => e.id === eid);
                    return ev ? (
                      <span key={eid} style={{
                        background: `${severityColor[ev.severity]}14`,
                        color: severityColor[ev.severity],
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 20,
                        border: `1px solid ${severityColor[ev.severity]}28`,
                      }}>
                        {ev.title.split(" — ")[1]}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {p.items.map(item => (
                  <span key={item} style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 6,
                    background: "var(--bg-elevated)", color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}>
                    {item}
                  </span>
                ))}
              </div>

              <div style={{
                borderTop: "1px solid var(--border)", paddingTop: 10,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{
                  fontSize: 11, color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}>
                  📞 {p.contact}
                </span>
                <span style={{
                  fontSize: 11,
                  color: isSelected ? "var(--blue-info)" : "var(--text-muted)",
                  fontWeight: isSelected ? 600 : 400,
                  fontFamily: "var(--font-mono)",
                }}>
                  {isSelected ? "📍 no mapa ✓" : "ver no mapa →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Busca por Proximidade ── */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 22px",
        marginBottom: 16,
      }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--text-muted)", letterSpacing: "0.18em",
          textTransform: "uppercase", marginBottom: 12,
        }}>
          Busca por Proximidade — Geolocalização Real
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, fontSize: 12 }}>
            {geoStatus === null && (
              <span style={{ color: "var(--text-muted)" }}>
                Clique em "Usar minha localização" para ordenar os pontos por distância real.
              </span>
            )}
            {geoStatus === "buscando" && (
              <span style={{ color: "#f97316" }}>📡 Obtendo sua localização...</span>
            )}
            {geoStatus === "ok" && userPos && (
              <span style={{ color: "var(--success)" }}>
                ✓ Localização obtida — pontos ordenados por distância real · {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
              </span>
            )}
            {geoStatus === "erro" && (
              <span style={{ color: "var(--danger)" }}>
                ✗ Não foi possível obter sua localização. Verifique as permissões do navegador.
              </span>
            )}
          </div>
          <button
            onClick={buscarLocalizacao}
            disabled={geoStatus === "buscando"}
            style={{
              background: geoStatus === "ok" ? "var(--success)" : "var(--navy-light)",
              border: "none", borderRadius: "var(--radius)",
              padding: "10px 20px",
              color: "#fff",
              fontWeight: 700, fontSize: 13,
              fontFamily: "var(--font-body)",
              cursor: geoStatus === "buscando" ? "not-allowed" : "pointer",
              opacity: geoStatus === "buscando" ? 0.6 : 1,
              whiteSpace: "nowrap",
              transition: "background 0.15s",
            }}
          >
            {geoStatus === "ok"
              ? "✓ Localização ativa"
              : geoStatus === "buscando"
              ? "📡 Buscando..."
              : "📍 Usar minha localização"}
          </button>
        </div>
      </div>

      {/* ── Mapa Mapbox ── */}
      <div style={{
        borderRadius: "var(--radius-lg)", overflow: "hidden",
        border: `1px solid ${pontSel ? "rgba(61,155,233,0.35)" : "var(--border)"}`,
        transition: "border-color 0.3s",
      }}>
        <div style={{
          background: "var(--bg-surface)",
          padding: "12px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase",
            }}>
              🗺 Mapa — Taubaté, SP
            </span>
            {pontSel && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--blue-info)", marginLeft: 12, fontWeight: 600,
              }}>
                → {pontSel.name}
              </span>
            )}
            {userPos && !pontSel && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--success)", marginLeft: 12,
              }}>
                ● Sua localização ativa
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {pontSel && (
              <button
                onClick={() => setPontSel(null)}
                style={{
                  background: "none", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "4px 10px",
                  color: "var(--text-muted)", fontSize: 11,
                  cursor: "pointer", fontFamily: "var(--font-mono)",
                }}
              >
                ✕ Limpar
              </button>
            )}
            {userPos && (
              <button
                onClick={() => { setUserPos(null); setGeoStatus(null); setPontosOrdenados(mockPoints); }}
                style={{
                  background: "none", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "4px 10px",
                  color: "var(--text-muted)", fontSize: 11,
                  cursor: "pointer", fontFamily: "var(--font-mono)",
                }}
              >
                ✕ Remover loc.
              </button>
            )}
          </div>
        </div>

        <MapView selectedPoint={pontSel} userPos={userPos} />

        <div style={{
          background: "var(--bg-surface)",
          padding: "10px 18px",
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between",
        }}>
          <span style={{
            fontSize: 10, color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}>
            {pontSel
              ? `📍 ${pontSel.name}${userPos && pontSel.distReal ? ` — ${formatDist(pontSel.distReal)} de você` : ""}`
              : userPos
              ? "● Sua localização marcada · pontos ordenados por distância"
              : "Clique em um card para centralizar · use sua localização para ver distâncias reais"}
          </span>
          <span style={{
            fontSize: 10, color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}>
            {mockPoints.length} pontos · Mapbox
          </span>
        </div>
      </div>
    </div>
  );
}
