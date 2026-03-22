import { useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import MapFocus from "../../components/MapFocus";
import { mockPoints } from "../../data/points";
import { mockEvents } from "../../data/events";
import { severityColor } from "../../constants/theme";
import { haversine, formatDist } from "../../utils/geo";

export default function PontosColeta({ perfil }) {
  const [pontSel, setPontSel] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [geoStatus, setGeoStatus] = useState(null);
  const [pontosOrdenados, setPontosOrdenados] = useState(mockPoints);

  const centerDefault = [-23.0319, -45.5606];
  const focusCoords = pontSel ? [pontSel.lat, pontSel.lng] : userPos ? [userPos.lat, userPos.lng] : null;

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
      (err) => { console.error(err); setGeoStatus("erro"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const userIcon = L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 0 10px #0ea5e9;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: perfil === "defesa" ? "#ff3b3b" : "#0ea5e9", letterSpacing: 4, fontFamily: "monospace", marginBottom: 4 }}>MÓDULO</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Courier New', monospace", margin: 0 }}>Pontos de Coleta</h1>
        </div>
        {perfil === "defesa" && (
          <button style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            + Cadastrar Ponto
          </button>
        )}
      </div>

      {/* Cards dos pontos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {pontosOrdenados.map((p, idx) => {
          const isSelected = pontSel?.id === p.id;
          const isNearest = geoStatus === "ok" && idx === 0;
          return (
            <div
              key={p.id}
              onClick={() => setPontSel(prev => prev?.id === p.id ? null : p)}
              style={{
                background: isSelected ? "#0f1f35" : "#0a1628",
                border: `1px solid ${isNearest ? "#10b981" : isSelected ? "#0ea5e9" : "#0f2040"}`,
                borderRadius: 14, padding: "18px", transition: "all 0.2s", cursor: "pointer",
                boxShadow: isSelected ? "0 0 16px #0ea5e920" : isNearest ? "0 0 12px #10b98120" : "none",
                position: "relative",
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "#0ea5e940"; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = isNearest ? "#10b981" : "#0f2040"; }}
            >
              {isNearest && (
                <div style={{ position: "absolute", top: -10, left: 14, background: "#10b981", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10, letterSpacing: 1, fontFamily: "monospace" }}>
                  ★ MAIS PRÓXIMO
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{
                  background: p.type === "Fixo" ? "#0ea5e920" : "#8b5cf620",
                  color: p.type === "Fixo" ? "#0ea5e9" : "#8b5cf6",
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  border: `1px solid ${p.type === "Fixo" ? "#0ea5e930" : "#8b5cf630"}`,
                }}>{p.type}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: geoStatus === "ok" ? "#10b981" : "#475569" }}>
                  {geoStatus === "ok" && p.distReal !== undefined ? formatDist(p.distReal) : p.dist || "—"}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 5 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>📍 {p.address}</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#334155", letterSpacing: 2, fontFamily: "monospace", marginBottom: 6 }}>E.A — EVENTOS ATIVOS</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.events.map(eid => {
                    const ev = mockEvents.find(e => e.id === eid);
                    return ev ? (
                      <span key={eid} style={{
                        background: `${severityColor[ev.severity]}20`,
                        color: severityColor[ev.severity],
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        border: `1px solid ${severityColor[ev.severity]}30`,
                      }}>
                        {ev.title.split(" — ")[1]}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {p.items.map(item => (
                  <span key={item} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: "#1e293b", color: "#94a3b8" }}>{item}</span>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #0f2040", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#334155" }}>📞 {p.contact}</span>
                <span style={{ fontSize: 11, color: isSelected ? "#0ea5e9" : "#334155", fontWeight: isSelected ? 700 : 400 }}>
                  {isSelected ? "📍 no mapa ✓" : "ver no mapa →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Busca por Proximidade */}
      <div style={{ marginTop: 20, background: "#0a1628", border: "1px solid #0f2040", borderRadius: 14, padding: "18px 22px" }}>
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
          Busca por Proximidade — Geolocalização Real
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
            {geoStatus === null && <span style={{ fontSize: 12, color: "#475569" }}>Clique em "Usar minha localização" para ordenar os pontos por distância real.</span>}
            {geoStatus === "buscando" && <span style={{ fontSize: 12, color: "#f97316" }}>📡 Obtendo sua localização...</span>}
            {geoStatus === "ok" && userPos && (
              <span style={{ fontSize: 12, color: "#10b981" }}>
                ✓ Localização obtida — pontos ordenados por distância real · {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
              </span>
            )}
            {geoStatus === "erro" && <span style={{ fontSize: 12, color: "#ef4444" }}>✗ Não foi possível obter sua localização. Verifique as permissões do navegador.</span>}
          </div>
          <button
            onClick={buscarLocalizacao}
            disabled={geoStatus === "buscando"}
            style={{
              background: geoStatus === "ok" ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
              border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: geoStatus === "buscando" ? "not-allowed" : "pointer",
              opacity: geoStatus === "buscando" ? 0.6 : 1, whiteSpace: "nowrap",
            }}
          >
            {geoStatus === "ok" ? "✓ Localização ativa" : geoStatus === "buscando" ? "📡 Buscando..." : "📍 Usar minha localização"}
          </button>
        </div>
      </div>

      {/* Mapa Leaflet */}
      <div style={{ marginTop: 16, borderRadius: 14, overflow: "hidden", border: `1px solid ${pontSel ? "#0ea5e940" : "#0f2040"}`, transition: "border-color 0.3s" }}>
        <div style={{ background: "#0a1628", padding: "12px 18px", borderBottom: "1px solid #0f2040", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>🗺 Mapa — Taubaté, SP</span>
            {pontSel && <span style={{ fontSize: 11, color: "#0ea5e9", marginLeft: 12, fontWeight: 700 }}>→ {pontSel.name}</span>}
            {userPos && !pontSel && <span style={{ fontSize: 11, color: "#10b981", marginLeft: 12 }}>● Sua localização ativa</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {pontSel && (
              <button onClick={() => setPontSel(null)} style={{ background: "none", border: "1px solid #1e293b", borderRadius: 8, padding: "4px 10px", color: "#475569", fontSize: 11, cursor: "pointer" }}>
                ✕ Limpar seleção
              </button>
            )}
            {userPos && (
              <button onClick={() => { setUserPos(null); setGeoStatus(null); setPontosOrdenados(mockPoints); }} style={{ background: "none", border: "1px solid #1e293b", borderRadius: 8, padding: "4px 10px", color: "#475569", fontSize: 11, cursor: "pointer" }}>
                ✕ Remover localização
              </button>
            )}
          </div>
        </div>

        <div style={{ height: 420 }}>
          <MapContainer center={centerDefault} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {focusCoords && <MapFocus coords={focusCoords} />}
            {userPos && (
              <>
                <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                  <Popup>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>📍 Sua localização</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}</div>
                  </Popup>
                </Marker>
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={1000}
                  pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.05, weight: 1, dashArray: "5,5" }}
                />
              </>
            )}
            {mockPoints.map(p => (
              <Marker key={p.id} position={[p.lat, p.lng]}>
                <Popup>
                  <div style={{ minWidth: 190 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>📍 {p.address}</div>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>📞 {p.contact}</div>
                    {userPos && p.distReal !== undefined && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginBottom: 6 }}>
                        📏 {formatDist(p.distReal)} de você
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.items.map(it => (
                        <span key={it} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#e2e8f0", color: "#334155" }}>{it}</span>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div style={{ background: "#0a1628", padding: "10px 18px", borderTop: "1px solid #0f2040", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "#334155" }}>
            {pontSel
              ? `📍 ${pontSel.name}${userPos && pontSel.distReal ? ` — ${formatDist(pontSel.distReal)} de você` : ""}`
              : userPos
              ? "● Sua localização marcada em azul · pontos ordenados por distância"
              : "Clique em um card para centralizar · use sua localização para ver distâncias reais"}
          </span>
          <span style={{ fontSize: 10, color: "#1e3a5f" }}>{mockPoints.length} pontos · OpenStreetMap</span>
        </div>
      </div>
    </div>
  );
}
