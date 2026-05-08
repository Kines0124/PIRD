import { useState, useCallback, useRef } from "react";
import Map, { Marker, Popup, NavigationControl, Source, Layer } from "react-map-gl";
import MapFocus from "../../components/MapFocus";
import { mockPoints } from "../../data/points";
import { mockEvents } from "../../data/events";
import { severityColor } from "../../constants/theme";
import { haversine, formatDist } from "../../utils/geo";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ─── Mapbox API helpers ───────────────────────────────────────────────────────

/** Geocoding: texto → { lat, lng, place_name } */
async function geocodeAddress(text) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    text
  )}.json?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=5`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.features || []).map((f) => ({
    place_name: f.place_name,
    lng: f.center[0],
    lat: f.center[1],
  }));
}

/** Geocoding reverso: { lat, lng } → endereço legível */
async function reverseGeocode(lat, lng) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=pt&types=address,place&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/** Directions: rota entre dois pontos → GeoJSON LineString */
async function getRoute(originLng, originLat, destLng, destLat) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}&language=pt`;
  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    geometry: route.geometry,
    distance: route.distance,   // metros
    duration: route.duration,   // segundos
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PontosColeta({ perfil }) {
  const [pontSel, setPontSel] = useState(null);
  const [popupPont, setPopupPont] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [geoStatus, setGeoStatus] = useState(null); // null | "buscando" | "ok" | "erro"
  const [pontosOrdenados, setPontosOrdenados] = useState(mockPoints);

  // Geocoding (busca por texto)
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState(null); // null | "buscando" | "ok" | "erro"
  const searchDebounce = useRef(null);

  // Directions
  const [route, setRoute] = useState(null); // { geometry, distance, duration }
  const [routeStatus, setRouteStatus] = useState(null); // null | "buscando" | "ok" | "erro"
  const [routeDistKm, setRouteDistKm] = useState(null); // distância real da rota em km (substitui haversine no display)

  const centerDefault = [-45.5606, -23.0319]; // [lng, lat] — Taubaté

  // Coordenadas de foco para MapFocus: ponto selecionado ou posição do usuário
  const focusCoords = pontSel
    ? [pontSel.lat, pontSel.lng]
    : userPos
    ? [userPos.lat, userPos.lng]
    : null;

  // ── Geolocation ──────────────────────────────────────────────────────────────
  async function buscarLocalizacao() {
    if (!navigator.geolocation) {
      setGeoStatus("erro");
      return;
    }
    setGeoStatus("buscando");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos({ lat, lng });
        setGeoStatus("ok");

        // Geocoding reverso para mostrar endereço legível
        const addr = await reverseGeocode(lat, lng);
        setUserAddress(addr);

        // Ordena pontos por distância real
        const comDistancia = mockPoints
          .map((p) => ({
            ...p,
            distReal: haversine(lat, lng, p.lat, p.lng),
          }))
          .sort((a, b) => a.distReal - b.distReal);
        setPontosOrdenados(comDistancia);

        // Calcula rota até o ponto mais próximo automaticamente
        const mais_proximo = comDistancia[0];
        calcularRota(lng, lat, mais_proximo.lng, mais_proximo.lat);
      },
      (err) => {
        console.error(err);
        setGeoStatus("erro");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function removerLocalizacao() {
    setUserPos(null);
    setUserAddress(null);
    setGeoStatus(null);
    setRoute(null);
    setRouteDistKm(null);
    setRouteStatus(null);
    setPontosOrdenados(mockPoints);
  }

  // ── Directions ───────────────────────────────────────────────────────────────
  async function calcularRota(oLng, oLat, dLng, dLat) {
    setRouteStatus("buscando");
    const r = await getRoute(oLng, oLat, dLng, dLat);
    if (r) {
      setRoute(r);
      setRouteDistKm(r.distance / 1000);
      setRouteStatus("ok");
    } else {
      setRouteStatus("erro");
    }
  }

  function handleSelecionarPonto(p) {
    const isSelected = pontSel?.id === p.id;
    if (isSelected) {
      setPontSel(null);
      setPopupPont(null);
      setRoute(null);
      setRouteDistKm(null);
      setRouteStatus(null);
    } else {
      setPontSel(p);
      setPopupPont(p);  // abre popup automaticamente ao selecionar pelo card
      if (userPos) {
        calcularRota(userPos.lng, userPos.lat, p.lng, p.lat);
      }
    }
  }

  // ── Geocoding (busca por texto) ───────────────────────────────────────────────
  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchText(val);
    setSearchResults([]);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (val.trim().length < 3) return;
    setSearchStatus("buscando");
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await geocodeAddress(val);
        setSearchResults(results);
        setSearchStatus("ok");
      } catch {
        setSearchStatus("erro");
      }
    }, 400);
  }

  function handleSelectSearchResult(result) {
    setUserPos({ lat: result.lat, lng: result.lng });
    setUserAddress(result.place_name);
    setGeoStatus("ok");
    setSearchText(result.place_name);
    setSearchResults([]);

    const comDistancia = mockPoints
      .map((p) => ({
        ...p,
        distReal: haversine(result.lat, result.lng, p.lat, p.lng),
      }))
      .sort((a, b) => a.distReal - b.distReal);
    setPontosOrdenados(comDistancia);

    const mais_proximo = comDistancia[0];
    calcularRota(result.lng, result.lat, mais_proximo.lng, mais_proximo.lat);
  }

  // ── GeoJSON da rota para o Layer ──────────────────────────────────────────────
  const routeGeoJSON = route
    ? { type: "Feature", geometry: route.geometry }
    : null;

  function formatDuration(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)} min`;
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: perfil === "defesa" ? "#ff3b3b" : "#0ea5e9",
              letterSpacing: 4,
              fontFamily: "monospace",
              marginBottom: 4,
            }}
          >
            MÓDULO
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#e2e8f0",
              fontFamily: "'Courier New', monospace",
              margin: 0,
            }}
          >
            Pontos de Coleta
          </h1>
        </div>
        {perfil === "defesa" && (
          <button
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Cadastrar Ponto
          </button>
        )}
      </div>

      {/* Cards dos pontos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {pontosOrdenados.map((p, idx) => {
          const isSelected = pontSel?.id === p.id;
          const isNearest = geoStatus === "ok" && idx === 0;
          return (
            <div
              key={p.id}
              onClick={() => handleSelecionarPonto(p)}
              style={{
                background: isSelected ? "#0f1f35" : "#0a1628",
                border: `1px solid ${
                  isNearest ? "#10b981" : isSelected ? "#0ea5e9" : "#0f2040"
                }`,
                borderRadius: 14,
                padding: "18px",
                transition: "all 0.2s",
                cursor: "pointer",
                boxShadow: isSelected
                  ? "0 0 16px #0ea5e920"
                  : isNearest
                  ? "0 0 12px #10b98120"
                  : "none",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isSelected)
                  e.currentTarget.style.borderColor = "#0ea5e940";
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.borderColor = isNearest
                    ? "#10b981"
                    : "#0f2040";
              }}
            >
              {isNearest && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    left: 14,
                    background: "#10b981",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 10,
                    letterSpacing: 1,
                    fontFamily: "monospace",
                  }}
                >
                  ★ MAIS PRÓXIMO
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    background:
                      p.type === "Fixo" ? "#0ea5e920" : "#8b5cf620",
                    color: p.type === "Fixo" ? "#0ea5e9" : "#8b5cf6",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                    border: `1px solid ${
                      p.type === "Fixo" ? "#0ea5e930" : "#8b5cf630"
                    }`,
                  }}
                >
                  {p.type}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: geoStatus === "ok" ? (isSelected && routeDistKm ? "#0ea5e9" : "#10b981") : "#475569",
                  }}
                >
                  {geoStatus === "ok"
                    ? isSelected && routeDistKm
                      ? `🛣 ${formatDist(routeDistKm)}`
                      : p.distReal !== undefined
                      ? `↗ ${formatDist(p.distReal)}`
                      : "—"
                    : p.dist || "—"}
                </span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#e2e8f0",
                  marginBottom: 5,
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>
                📍 {p.address}
              </div>
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: "#334155",
                    letterSpacing: 2,
                    fontFamily: "monospace",
                    marginBottom: 6,
                  }}
                >
                  E.A — EVENTOS ATIVOS
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.events.map((eid) => {
                    const ev = mockEvents.find((e) => e.id === eid);
                    return ev ? (
                      <span
                        key={eid}
                        style={{
                          background: `${severityColor[ev.severity]}20`,
                          color: severityColor[ev.severity],
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                          border: `1px solid ${severityColor[ev.severity]}30`,
                        }}
                      >
                        {ev.title.split(" — ")[1]}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  marginBottom: 10,
                }}
              >
                {p.items.map((item) => (
                  <span
                    key={item}
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: "#1e293b",
                      color: "#94a3b8",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div
                style={{
                  borderTop: "1px solid #0f2040",
                  paddingTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 11, color: "#334155" }}>
                  📞 {p.contact}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: isSelected ? "#0ea5e9" : "#334155",
                    fontWeight: isSelected ? 700 : 400,
                  }}
                >
                  {isSelected ? "📍 no mapa ✓" : "ver no mapa →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Painel de localização + geocoding ── */}
      <div
        style={{
          marginTop: 20,
          background: "#0a1628",
          border: "1px solid #0f2040",
          borderRadius: 14,
          padding: "18px 22px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#475569",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Localização — Geolocalização ou Busca por Endereço
        </div>

        {/* Busca por endereço (Geocoding) */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Digite um endereço para encontrar pontos próximos..."
            style={{
              width: "100%",
              background: "#050e1a",
              border: "1px solid #1e293b",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#e2e8f0",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0ea5e960")}
            onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
          />
          {searchStatus === "buscando" && (
            <span
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11,
                color: "#475569",
              }}
            >
              🔍 buscando...
            </span>
          )}
          {/* Dropdown de resultados */}
          {searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "#0a1628",
                border: "1px solid #1e293b",
                borderRadius: 10,
                zIndex: 1000,
                overflow: "hidden",
                boxShadow: "0 8px 24px #00000060",
              }}
            >
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectSearchResult(r)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#94a3b8",
                    borderBottom:
                      i < searchResults.length - 1
                        ? "1px solid #0f2040"
                        : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#0f1f35")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  📍 {r.place_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botões e status de geolocalização */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            {geoStatus === null && (
              <span style={{ fontSize: 12, color: "#475569" }}>
                Use sua localização atual ou busque um endereço acima para ordenar os pontos por distância.
              </span>
            )}
            {geoStatus === "buscando" && (
              <span style={{ fontSize: 12, color: "#f97316" }}>
                📡 Obtendo sua localização...
              </span>
            )}
            {geoStatus === "ok" && userPos && (
              <div>
                <span style={{ fontSize: 12, color: "#10b981" }}>
                  ✓ Localização definida — pontos ordenados por distância
                </span>
                {userAddress && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      marginTop: 3,
                    }}
                  >
                    📍 {userAddress}
                  </div>
                )}
              </div>
            )}
            {geoStatus === "erro" && (
              <span style={{ fontSize: 12, color: "#ef4444" }}>
                ✗ Não foi possível obter sua localização. Verifique as permissões do navegador ou use a busca por endereço.
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={buscarLocalizacao}
              disabled={geoStatus === "buscando"}
              style={{
                background:
                  geoStatus === "ok"
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: geoStatus === "buscando" ? "not-allowed" : "pointer",
                opacity: geoStatus === "buscando" ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {geoStatus === "ok"
                ? "✓ GPS ativo"
                : geoStatus === "buscando"
                ? "📡 Buscando..."
                : "📍 Usar GPS"}
            </button>
            {userPos && (
              <button
                onClick={removerLocalizacao}
                style={{
                  background: "none",
                  border: "1px solid #1e293b",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "#475569",
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ✕ Remover
              </button>
            )}
          </div>
        </div>

        {/* Info de rota */}
        {routeStatus === "buscando" && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#f97316",
              fontFamily: "monospace",
            }}
          >
            🗺 Calculando rota...
          </div>
        )}
        {routeStatus === "ok" && route && (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 20,
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#0ea5e9",
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              🛣 Rota:{" "}
              <span style={{ color: "#e2e8f0" }}>
                {formatDist(route.distance / 1000)}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#0ea5e9",
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              ⏱ Tempo a pé:{" "}
              <span style={{ color: "#e2e8f0" }}>
                {formatDuration(route.duration)}
              </span>
            </div>
            {pontSel && (
              <div style={{ fontSize: 12, color: "#475569" }}>
                → {pontSel.name}
              </div>
            )}
          </div>
        )}
        {routeStatus === "erro" && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#ef4444",
              fontFamily: "monospace",
            }}
          >
            ✗ Não foi possível calcular a rota.
          </div>
        )}
      </div>

      {/* ── Mapa Mapbox ── */}
      <div
        style={{
          marginTop: 16,
          borderRadius: 14,
          overflow: "hidden",
          border: `1px solid ${pontSel ? "#0ea5e940" : "#0f2040"}`,
          transition: "border-color 0.3s",
        }}
      >
        {/* Barra superior do mapa */}
        <div
          style={{
            background: "#0a1628",
            padding: "12px 18px",
            borderBottom: "1px solid #0f2040",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                color: "#475569",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              🗺 Mapa — Taubaté, SP
            </span>
            {pontSel && (
              <span
                style={{
                  fontSize: 11,
                  color: "#0ea5e9",
                  marginLeft: 12,
                  fontWeight: 700,
                }}
              >
                → {pontSel.name}
              </span>
            )}
            {userPos && !pontSel && (
              <span
                style={{
                  fontSize: 11,
                  color: "#10b981",
                  marginLeft: 12,
                }}
              >
                ● Sua localização ativa
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {pontSel && (
              <button
                onClick={() => {
                  setPontSel(null);
                  setRoute(null);
                  setRouteStatus(null);
                }}
                style={{
                  background: "none",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "4px 10px",
                  color: "#475569",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                ✕ Limpar seleção
              </button>
            )}
          </div>
        </div>

        {/* Mapa */}
        <div style={{ height: 420 }}>
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: centerDefault[0],
              latitude: centerDefault[1],
              zoom: 13,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/standard"
          >
            <NavigationControl position="top-right" />

            {/* Voa para ponto selecionado ou localização do usuário */}
            {focusCoords && <MapFocus coords={focusCoords} zoom={15} />}

            {/* Rota (Directions) */}
            {routeGeoJSON && (
              <Source id="route" type="geojson" data={routeGeoJSON}>
                {/* Sombra da linha */}
                <Layer
                  id="route-shadow"
                  type="line"
                  paint={{
                    "line-color": "#0ea5e9",
                    "line-width": 6,
                    "line-opacity": 0.15,
                    "line-blur": 4,
                  }}
                  layout={{ "line-cap": "round", "line-join": "round" }}
                />
                {/* Linha principal */}
                <Layer
                  id="route-line"
                  type="line"
                  paint={{
                    "line-color": "#0ea5e9",
                    "line-width": 3,
                    "line-opacity": 0.9,
                    "line-dasharray": [2, 1],
                  }}
                  layout={{ "line-cap": "round", "line-join": "round" }}
                />
              </Source>
            )}

            {/* Marcador da localização do usuário */}
            {userPos && (
              <Marker
                longitude={userPos.lng}
                latitude={userPos.lat}
                anchor="center"
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#0ea5e9",
                    border: "3px solid #fff",
                    boxShadow: "0 0 12px #0ea5e9",
                    cursor: "default",
                  }}
                />
              </Marker>
            )}

            {/* Marcadores dos pontos de coleta */}
            {mockPoints.map((p) => {
              const isSelected = pontSel?.id === p.id;
              return (
                <Marker
                  key={p.id}
                  longitude={p.lng}
                  latitude={p.lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setPopupPont(p);
                    handleSelecionarPonto(p);
                  }}
                >
                  <div
                    style={{
                      width: isSelected ? 18 : 14,
                      height: isSelected ? 18 : 14,
                      borderRadius: "50%",
                      background: isSelected ? "#0ea5e9" : "#ff3b3b",
                      border: `2px solid ${isSelected ? "#fff" : "#ff3b3b80"}`,
                      boxShadow: isSelected
                        ? "0 0 12px #0ea5e9"
                        : "0 0 6px #ff3b3b80",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  />
                </Marker>
              );
            })}

            {/* Popup do ponto selecionado */}
            {popupPont && (() => {
              const pontComDist = pontosOrdenados.find(p => p.id === popupPont.id) ?? popupPont;
              return (
              <Popup
                longitude={popupPont.lng}
                latitude={popupPont.lat}
                anchor="bottom"
                offset={20}
                onClose={() => setPopupPont(null)}
                closeButton={true}
                style={{ fontFamily: "system-ui" }}
              >
                <div style={{ minWidth: 190, padding: "2px 4px" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 4,
                      color: "#0f172a",
                    }}
                  >
                    {popupPont.name}
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#555", marginBottom: 3 }}
                  >
                    📍 {popupPont.address}
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>
                    📞 {popupPont.contact}
                  </div>
                  {userPos && (routeDistKm !== null && pontSel?.id === popupPont.id ? (
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9", marginBottom: 6 }}>
                      🛣 {formatDist(routeDistKm)} de você (pela rua) · ⏱ {formatDuration(route.duration)} a pé
                    </div>
                  ) : pontComDist.distReal !== undefined ? (
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginBottom: 6 }}>
                      ↗ {formatDist(pontComDist.distReal)} de você (linha reta)
                    </div>
                  ) : null)}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {popupPont.items.map((it) => (
                      <span
                        key={it}
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#e2e8f0",
                          color: "#334155",
                        }}
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              </Popup>
              );
            })()}
          </Map>
        </div>

        {/* Barra inferior do mapa */}
        <div
          style={{
            background: "#0a1628",
            padding: "10px 18px",
            borderTop: "1px solid #0f2040",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 10, color: "#334155" }}>
            {pontSel
              ? `📍 ${pontSel.name}${
                  userPos && routeDistKm
                    ? ` — 🛣 ${formatDist(routeDistKm)} pela rua`
                    : userPos && pontosOrdenados.find(p => p.id === pontSel.id)?.distReal
                    ? ` — ↗ ${formatDist(pontosOrdenados.find(p => p.id === pontSel.id).distReal)} linha reta`
                    : ""
                }`
              : userPos
              ? "● Localização marcada em azul · pontos ordenados por distância · rota calculada até o mais próximo"
              : "Clique em um card ou marcador para selecionar · use GPS ou busca para calcular distâncias e rota"}
          </span>
          <span style={{ fontSize: 10, color: "#1e3a5f" }}>
            {mockPoints.length} pontos · Mapbox
          </span>
        </div>
      </div>
    </div>
  );
}
