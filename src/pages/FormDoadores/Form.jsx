import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { mockPoints } from "../../data/points";
import { colors } from "../../constants/theme.js";
import { useNavigate } from "react-router-dom";
import { haversine } from "../../utils/geo.js";

// Componente auxiliar — centraliza o mapa num ponto quando chamado
function FlyTo({ coords }) {
  const map = useMap();
  if (coords) map.flyTo(coords, 15, { duration: 1.2 });
  return null;
}

export default function DoadoresForm() {
  const [tipo, setTipo] = useState("");
  const [pontoInput, setPontoInput] = useState("");
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [localizando, setLocalizando] = useState(false);

  const navigate = useNavigate();

  const sugestoes = mockPoints.filter(p =>
    p.name.toLowerCase().includes(pontoInput.toLowerCase())
  );

  function handleMaisProximo() {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Calcula distância de cada ponto e pega o menor
        const maisProximo = mockPoints.reduce((melhor, ponto) => {
          const dist = haversine(latitude, longitude, ponto.lat, ponto.lng);
          return dist < melhor.dist ? { ponto, dist } : melhor;
        }, { ponto: mockPoints[0], dist: Infinity }).ponto;

        setPontoInput(maisProximo.name);
        setMapCenter([maisProximo.lat, maisProximo.lng]);
        setLocalizando(false);
      },
      () => {
        alert("Não foi possível obter sua localização.");
        setLocalizando(false);
      }
    );
  }

  const inputStyle = {
    background: "rgba(255, 251, 236, 0.05)",
    border: `1px solid ${colors.sky}40`,
    borderRadius: "8px",
    padding: "12px",
    color: colors.cream,
    marginBottom: "16px",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "sans-serif",
    fontWeight: "bold",
    width: "100%",
    boxSizing: "border-box"
  };

  const labelStyle = {
    fontSize: "12px",
    color: colors.lightGold,
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "6px",
    fontFamily: "sans-serif",
    display: "block",
    fontWeight: "600"
  };

  return (
    <div className="ContainerForm" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      minHeight: "100vh",
      background: "#050e1a",
    }}>

      {/* Cabeçalho */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: 6, color: colors.sky, fontFamily: "monospace", marginBottom: 12, fontWeight: "bold" }}>
          RECURSOS · LOGÍSTICA
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: colors.cream, margin: 0, letterSpacing: -1, fontFamily: "'Courier New', monospace" }}>
          NOVA DOAÇÃO
        </h2>
      </div>

      {/* Formulário */}
      <form style={{
        display: "flex", flexDirection: "column", width: "100%", maxWidth: "400px",
        background: colors.navy, padding: "32px", borderRadius: "18px",
        border: `1px solid ${colors.gold}30`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
      }}>

        <label style={labelStyle}>Nome</label>
        <input type="text" placeholder="Digite seu nome" style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = colors.gold}
          onBlur={(e) => e.target.style.borderColor = `${colors.sky}40`}
        />

        <label style={labelStyle}>Telefone</label>
        <input type="text" placeholder="(00) 0000-0000" style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = colors.gold}
          onBlur={(e) => e.target.style.borderColor = `${colors.sky}40`}
        />

        <label style={labelStyle}>Categoria de Item</label>
        <select onChange={(e) => setTipo(e.target.value)} style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = colors.gold}
          onBlur={(e) => e.target.style.borderColor = `${colors.sky}40`}
        >
          <option value="" style={{ background: colors.navy }}>Selecione o tipo</option>
          <option value="Alimento" style={{ background: colors.navy }}>Alimento (Sólido)</option>
          <option value="Bebida" style={{ background: colors.navy }}>Bebida (Líquido)</option>
        </select>

        <label style={labelStyle}>Descrição do Item</label>
        <input type="text" placeholder="Ex: Arroz" style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = colors.gold}
          onBlur={(e) => e.target.style.borderColor = `${colors.sky}40`}
        />

        <label style={labelStyle}>Volume / Quantidade</label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input type="number" placeholder="0"
            style={{ ...inputStyle, flex: 2, MozAppearance: "textfield" }}
            onFocus={(e) => e.target.style.borderColor = colors.gold}
            onBlur={(e) => e.target.style.borderColor = `${colors.sky}40`}
          />
          <select style={{ ...inputStyle, flex: 1 }}
            onFocus={(e) => e.target.style.borderColor = colors.gold}
            onBlur={(e) => e.target.style.borderColor = `${colors.sky}40`}
          >
            {tipo === "Bebida" ? (
              <>
                <option value="L" style={{ background: colors.navy }}>L</option>
                <option value="ml" style={{ background: colors.navy }}>ML</option>
              </>
            ) : (
              <>
                <option value="kg" style={{ background: colors.navy }}>KG</option>
                <option value="g" style={{ background: colors.navy }}>G</option>
                <option value="un" style={{ background: colors.navy }}>UN</option>
              </>
            )}
          </select>
        </div>

        <label style={labelStyle}>Destino da Carga</label>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Ponto de entrega"
            value={pontoInput}
            onChange={(e) => { setPontoInput(e.target.value); setShowSugestoes(true); }}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = colors.gold; setShowSugestoes(true); }}
            onBlur={(e) => { e.target.style.borderColor = `${colors.sky}40`; setTimeout(() => setShowSugestoes(false), 150); }}
          />
          {showSugestoes && sugestoes.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% - 12px)", left: 0, right: 0,
              background: colors.navy, border: `1px solid ${colors.gold}30`,
              borderRadius: "0 0 8px 8px", zIndex: 10, overflow: "hidden",
            }}>
              {sugestoes.map(p => (
                <div key={p.id}
                  onMouseDown={() => { setPontoInput(p.name); setMapCenter([p.lat, p.lng]); setShowSugestoes(false); }}
                  style={{ padding: "10px 12px", color: colors.alabaster, cursor: "pointer", fontSize: 13, fontFamily: "monospace" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${colors.gold}12`}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" style={{
          marginTop: "12px", padding: "16px",
          background: colors.gold, border: "none", borderRadius: "12px",
          color: colors.navy, fontWeight: "900", fontFamily: "monospace",
          letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s"
        }}
          onMouseEnter={e => { e.currentTarget.style.background = colors.lightGold; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = colors.gold; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          REGISTRAR DOAÇÃO
        </button>
      </form>

      <button
        type="button"
        onClick={handleMaisProximo}
        disabled={localizando}
        style={{
          marginTop: 24,
          padding: "9px 12px",
          background: "transparent",
          border: `1px solid ${colors.sky}60`,
          borderRadius: 8, color: colors.sky,
          fontFamily: "monospace", fontSize: 12,
          cursor: localizando ? "wait" : "pointer",
          letterSpacing: 1, transition: "all 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = colors.sky}
        onMouseLeave={e => e.currentTarget.style.borderColor = `${colors.sky}60`}
      >
        {localizando ? "Localizando..." : "◉ Usar ponto mais próximo"}
      </button>

      {/* Mapa */}
      <div style={{ width: "100%", maxWidth: "400px", marginTop: 8, borderRadius: 18, overflow: "hidden", border: `1px solid ${colors.gold}30` }}>
        <MapContainer
          center={[-23.0320, -45.5557]}
          zoom={13}
          style={{ height: 300, width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Voa para o ponto selecionado quando mapCenter muda */}
          {mapCenter && <FlyTo coords={mapCenter} />}

          {mockPoints.map(p => (
            <Marker key={p.id} position={[p.lat, p.lng]}>
              <Popup>
                <strong>{p.name}</strong><br />
                {p.address}<br />
                <span style={{ fontSize: 11, color: "#666" }}>{p.items.join(", ")}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Botão Início */}
      <button onClick={() => navigate("/login")} style={{
        position: "fixed", top: 14, right: 16, zIndex: 999,
        background: colors.navy, border: "1px solid #0f2040",
        borderRadius: 20, padding: "7px 18px",
        color: colors.alabaster, fontSize: 11, fontWeight: "bold",
        cursor: "pointer", fontFamily: "sans-serif",
      }}>
        Inicio
      </button>
    </div>
  );
}