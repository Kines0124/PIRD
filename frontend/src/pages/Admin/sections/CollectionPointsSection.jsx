import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { gsap } from "gsap";
import { MAPBOX_TOKEN } from "../../../utils/geocoding.js";
import { BsBox2HeartFill }     from "react-icons/bs";
import { FaMapMarkedAlt }      from "react-icons/fa";
import { IoIosPin }            from "react-icons/io";
import { BiMapPin } from "react-icons/bi";
import { FaClipboard } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Mapbox map (sem alterações) ─────────────────────────────────────────────
function CollectionMap({ points, selectedId }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-45.56, -23.03],
      zoom: 12, pitch: 45, antialias: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("style.load", () => {
      const layers = map.getStyle().layers;
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
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    points.forEach(p => {
      if (!p.lat || !p.lng) return;
      const isSelected = selectedId === p.id;
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:26px;height:26px;border-radius:6px;background:${isSelected ? "var(--accent)" : "#3B82F6"};border:2px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 10px ${isSelected ? "var(--accent)88" : "#3B82F688"};cursor:pointer">📦</div>`;
      const popup = new mapboxgl.Popup({ offset: 14 }).setHTML(
        `<div style="font-family:sans-serif;min-width:160px"><div style="font-weight:700;font-size:13px;margin-bottom:4px">📦 ${p.name}</div><div style="font-size:11px;color:#555">📍 ${p.address || ""}, ${p.city || ""}</div></div>`
      );
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([parseFloat(p.lng), parseFloat(p.lat)])
        .setPopup(popup)
        .addTo(map);
      markersRef.current[p.id] = marker;
    });
    if (selectedId && markersRef.current[selectedId]) {
      const m = markersRef.current[selectedId];
      map.flyTo({ center: m.getLngLat(), zoom: 15, duration: 800 });
      m.togglePopup();
    }
  }, [points, selectedId]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>Configure VITE_MAPBOX_TOKEN para visualizar o mapa.</div>
      </div>
    );
  }

  return <div ref={containerRef} style={{ height: "100%", width: "100%", borderRadius: 8 }} />;
}

// ── Detail drawer animado ───────────────────────────────────────────────────
function PontoDetailDrawer({ ponto, onClose }) {
  const overlayRef = useRef(null);
  const panelRef   = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    tl.fromTo(panelRef.current,   { x: 48, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35 }, "<0.06");
    tl.fromTo(
      contentRef.current?.querySelectorAll(".drawer-item") || [],
      { x: 16, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.06, duration: 0.28 },
      "-=0.16"
    );
  }, []);

  function handleClose() {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current,   { x: 48, opacity: 0, duration: 0.22, ease: "power2.in" });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.18 }, "<0.04");
  }

  const Row = ({ label, value }) => (
    <div className="drawer-item" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "start" }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{value || "—"}</span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="drawer-item">
      <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: "var(--font-mono)" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }}>
      <div
        ref={overlayRef}
        style={{ flex: 1, background: "rgba(0,0,0,0.5)", opacity: 0 }}
        onClick={handleClose}
      />

      <div
        ref={panelRef}
        style={{ width: 420, background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", opacity: 0, willChange: "transform, opacity" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: "rgba(222,57,63,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            <BsBox2HeartFill />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 3 }}>{ponto.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{ponto.type || "Ponto de Coleta"}</div>
          </div>
          <button
            onClick={handleClose}
            style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Status badge */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-elevated)" }}>
          <span style={{ backgroundColor: "rgba(22,163,74,0.12)", color: "#16a34a", borderRadius: 99, fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>
            ✓ Ponto Validado
          </span>
        </div>

        {/* Body */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <Section title="Identificação">
            <Row label="Nome"  value={ponto.name} />
            <Row label="CNPJ"  value={ponto.cnpj} />
            <Row label="Tipo"  value={ponto.type} />
          </Section>

          <div className="drawer-item" style={{ height: 1, background: "var(--border)" }} />

          <Section title="Contato">
            <Row label="Telefone" value={ponto.phone} />
            <Row label="E-mail"   value={ponto.email} />
          </Section>

          <div className="drawer-item" style={{ height: 1, background: "var(--border)" }} />

          <Section title="Endereço">
            <Row label="Endereço" value={ponto.address} />
            <Row label="Cidade"   value={ponto.city} />
          </Section>

          {(ponto.lat || ponto.lng) && (
            <>
              <div className="drawer-item" style={{ height: 1, background: "var(--border)" }} />
              <Section title="Localização GPS">
                <Row label="Latitude"  value={ponto.lat ? ponto.lat.toFixed(6) : "—"} />
                <Row label="Longitude" value={ponto.lng ? ponto.lng.toFixed(6) : "—"} />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card animado ────────────────────────────────────────────────────────────
function PontoCard({ ponto, onClick, animIndex }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { x: 28, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: "power3.out", delay: animIndex * 0.055 }
    );
  }, []);

  function handleMouseEnter() {
    gsap.to(cardRef.current, { x: 2, boxShadow: "0 4px 18px rgba(0,0,0,0.15)", duration: 0.2, ease: "power2.out", overwrite: "auto" });
  }
  function handleMouseLeave() {
    gsap.to(cardRef.current, { x: 0, boxShadow: "0 0px 0px rgba(0,0,0,0)", duration: 0.25, ease: "power2.inOut", overwrite: "auto" });
  }
  function handleMouseDown() {
    gsap.to(cardRef.current, { scale: 0.985, duration: 0.1, ease: "power1.in", overwrite: "auto" });
  }
  function handleMouseUp() {
    gsap.to(cardRef.current, { scale: 1, duration: 0.2, ease: "back.out(2)", overwrite: "auto" });
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10,
        padding: 16, cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start",
        opacity: 0, willChange: "transform, opacity",
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "rgba(222,57,63,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        <BsBox2HeartFill />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {ponto.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>
          📍 {ponto.address || "Sem endereço"}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {ponto.type && (
            <span style={{ fontSize: 10, backgroundColor: "rgba(222,57,63,0.12)", color: "var(--accent)", borderRadius: 99, padding: "1px 8px", fontWeight: 600 }}>
              {ponto.type}
            </span>
          )}
          {ponto.cnpj && (
            <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 6px", fontFamily: "var(--font-mono)" }}>
              {ponto.cnpj}
            </span>
          )}
        </div>
      </div>
      <div style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }}>›</div>
    </div>
  );
}

// ── Item da lista lateral (tab localizações) ────────────────────────────────
function MapListItem({ ponto, isSelected, onClick, animIndex }) {
  const itemRef = useRef(null);

  useEffect(() => {
    if (!itemRef.current) return;
    gsap.fromTo(
      itemRef.current,
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.36, ease: "power2.out", delay: animIndex * 0.05 }
    );
  }, []);

  return (
    <div
      ref={itemRef}
      onClick={onClick}
      style={{
        padding: "13px 16px", borderBottom: "1px solid var(--border)",
        cursor: "pointer", transition: "background 0.15s",
        background: isSelected ? "var(--bg-hover)" : "transparent",
        borderLeft: `3px solid ${isSelected ? "var(--accent)" : "transparent"}`,
        opacity: 0, willChange: "transform, opacity",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{ponto.name}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}><BiMapPin style={{fontSize: 12}}/> {ponto.address}</div>
      <span style={{ fontSize: 10, color: isSelected ? "var(--accent)" : "var(--text-muted)" }}>
        {isSelected ? <> <IoIosPin /> no mapa ✓</> : "ver no mapa →"}
      </span>
    </div>
  );
}

// ── Main section ────────────────────────────────────────────────────────────
export default function CollectionPointsSection({ collectionPoints, openCollectionId, onCollectionOpened }) {
  const [tab,      setTab]      = useState("informacoes");
  const [selected, setSelected] = useState(null);
  const [selId,    setSelId]    = useState(null);
  const [search,   setSearch]   = useState("");

  const headerRef  = useRef(null);
  const tabsRef    = useRef(null);
  const gridRef    = useRef(null);
  const prevTab    = useRef(tab);
  const prevSearch = useRef(search);

  // Abrir via prop externa
  useEffect(() => {
    if (!openCollectionId || collectionPoints.length === 0) return;
    const ponto = collectionPoints.find(p => String(p.id) === String(openCollectionId));
    if (ponto) {
      setTab("informacoes");
      setSelected(ponto);
      if (onCollectionOpened) onCollectionOpened();
    }
  }, [openCollectionId, collectionPoints]);

  // Entrada da seção
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(headerRef.current, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32 });
    tl.fromTo(tabsRef.current,   { y: -6,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.28 }, "-=0.14");
  }, []);

  // Transição ao trocar tab
  useEffect(() => {
    if (!gridRef.current || prevTab.current === tab) return;
    prevTab.current = tab;
    gsap.fromTo(gridRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
  }, [tab]);

  // Fade leve ao filtrar
  useEffect(() => {
    if (!gridRef.current || prevSearch.current === search) return;
    prevSearch.current = search;
    gsap.fromTo(gridRef.current, { opacity: 0.45 }, { opacity: 1, duration: 0.2, ease: "power1.out" });
  }, [search]);

  const validados = collectionPoints.filter(p => p.status === "validado");
  const filtered  = validados.filter(p =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.cnpj || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
    <div className="card">
      {/* Header */}
      <div ref={headerRef} className="card-header" style={{ opacity: 0 }}>
        <div>
          <div className="card-title"><BsBox2HeartFill style={{color: "#3B82F6"}}/> Pontos de Coleta</div>
          <div className="card-subtitle">Visualização e informações dos pontos validados</div>
        </div>
        <div className="text-sm text-muted mono">{validados.length} ponto(s) validado(s)</div>
      </div>

      {/* Tabs */}
      <div ref={tabsRef} className="tabs" style={{ opacity: 0 }}>
        <div className={`tab ${tab === "informacoes" ? "active" : ""}`} onClick={() => setTab("informacoes")}>
          <FaClipboard style={{fontSize:14}}/> Informações ({validados.length})
        </div>
        <div className={`tab ${tab === "localizacoes" ? "active" : ""}`} onClick={() => { setTab("localizacoes"); setSelId(null); }}>
          <FaMapMarkedAlt style={{fontSize:14}}/> Localizações
        </div>
      </div>

      {/* ── Informações tab ── */}
      {tab === "informacoes" && (
        <div ref={gridRef} style={{ padding: "16px 20px" }}>
          <div style={{ marginBottom: 18 }}>
            <input
              className="search-input"
              placeholder="Buscar por nome ou CNPJ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", maxWidth: 400 }}
            />
          </div>

          {search && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
              {filtered.length} resultado(s) encontrado(s)
            </div>
          )}

          {validados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><BsBox2HeartFill style={{color: "#3B82F6"}}/></div>
              <div className="empty-state-text">Nenhum ponto validado ainda.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">Nenhum ponto encontrado para a busca.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {filtered.map((p, i) => (
                <PontoCard key={p.id} ponto={p} animIndex={i} onClick={() => setSelected(p)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Localizações tab ── */}
      {tab === "localizacoes" && (
        <div ref={gridRef} style={{ display: "flex", height: 480 }}>
          {/* Lista lateral */}
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <input
                className="search-input"
                placeholder="🔍 Buscar ponto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><BsBox2HeartFill style={{color: "#3B82F6"}}/></div>
                  <div className="empty-state-text">Nenhum ponto validado</div>
                </div>
              ) : filtered.map((p, i) => (
                <MapListItem
                  key={p.id}
                  ponto={p}
                  isSelected={selId === p.id}
                  animIndex={i}
                  onClick={() => setSelId(prev => prev === p.id ? null : p.id)}
                />
              ))}
            </div>
          </div>

          {/* Mapa */}
          <div style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="empty-state-icon"><FaMapMarkedAlt /></div>
                <div className="empty-state-text">Nenhum ponto para exibir</div>
              </div>
            ) : (
              <CollectionMap points={filtered} selectedId={selId} />
            )}
          </div>
        </div>
      )}
    </div>

      {selected && (
        <PontoDetailDrawer ponto={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}