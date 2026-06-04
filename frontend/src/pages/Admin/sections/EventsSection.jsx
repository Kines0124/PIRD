import { useState, useEffect, useRef, Fragment, useLayoutEffect } from "react";
import { gsap } from "gsap";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../../utils/geocoding.js";
import { severityColor, typeIcon, riskColor, severityBadge, statusBadge } from "../adminTheme.jsx";
import EventModal from "../modals/EventModal.jsx";
import EventClosureModal from "../modals/EventClosureModal";
import { convocarManual, getFotosByEvento, uploadFoto, deletarFoto } from "../../../services/adminApi.js";
import { FaTrash, FaMapMarkedAlt } from "react-icons/fa";
import { IoWarningOutline }        from "react-icons/io5";
import { MdPhotoCamera }           from "react-icons/md";
import { BsBox2HeartFill }         from "react-icons/bs";
import { FaStaffSnake }            from "react-icons/fa6";
import { FaCalendarDays }          from "react-icons/fa6";
import { IoIosPin }                from "react-icons/io";
import { MdFlood }                 from "react-icons/md";
import { GoGoal }                  from "react-icons/go";
import { CiEdit }                  from "react-icons/ci";

const PROF_COLORS = {
  "Médico Clínico Geral":      "#2563eb",
  "Médico Emergencista":       "#2563eb",
  "Médico Cardiologista":      "#2563eb",
  "Médico Neurologista":       "#2563eb",
  "Médico Ortopedista":        "#2563eb",
  "Médico Intensivista (UTI)": "#2563eb",
  "Enfermeiro(a)":             "#16a34a",
  "Técnico de Enfermagem":     "#16a34a",
  "Psicólogo":                 "#0891b2",
  "Assistente Social":         "#0891b2",
  "Engenheiro de Segurança":   "#d97706",
  "Engenheiro Civil":          "#d97706",
  "Técnico em Resgate":        "#71717a",
  "Técnico Defesa Civil":      "var(--accent)",
  "Guia de Cão de Resgate":    "#71717a",
  "Mergulhador de Resgate":    "#71717a",
};

const FIELD_STATUS_MAP = {
  disponivel: { label: "Disponível",    color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
  pendente:   { label: "Convocado",     color: "#ca8a04", bg: "rgba(202,138,4,0.12)" },
  a_caminho:  { label: "A caminho",     color: "#2563eb", bg: "rgba(37,99,235,0.12)" },
  no_local:   { label: "No local",      color: "#dc2626", bg: "rgba(220,38,38,0.12)" },
};

// ─── Linha de especialista na aba Convocar ────────────────────────────────────
function SpecialistAssignRow({ spec, effectiveStatus, onAssign }) {
  const color = PROF_COLORS[spec.profissao] || "#71717a";
  const st    = FIELD_STATUS_MAP[effectiveStatus] || FIELD_STATUS_MAP.disponivel;
  const canAssign = effectiveStatus === "disponivel";

  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 13, flexShrink: 0 }}>
        {spec.nome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{spec.nome}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{spec.profissao}{spec.uf ? ` · ${spec.uf}` : ""}</div>
      </div>
      {canAssign ? (
        <button
          onClick={onAssign}
          style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Convocar →
        </button>
      ) : (
        <span style={{ backgroundColor: st.bg, color: st.color, borderRadius: 99, fontSize: 10, fontWeight: 600, padding: "3px 10px", flexShrink: 0, whiteSpace: "nowrap" }}>
          {st.label}
        </span>
      )}
    </div>
  );
}

// ─── Mini-mapa Mapbox do drawer ───────────────────────────────────────────────
function EventDetailMap({ event, collectionPoints, criticalPoints }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    const lat = parseFloat(event.lat);
    const lng = parseFloat(event.lng);
    if (!containerRef.current || !MAPBOX_TOKEN || isNaN(lat) || isNaN(lng)) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 13, pitch: 45, antialias: true,
    });
    mapRef.current = map;

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

    const color = severityColor[event.severity] || "var(--accent)";
    const eventEl = document.createElement("div");
    eventEl.innerHTML = `<div style="width:34px;height:34px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 16px ${color}88;cursor:pointer">${typeIcon[event.type] || <IoWarningOutline style={{color: "yellow"}}/>}</div>`;
    new mapboxgl.Marker({ element: eventEl, anchor: "center" })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<b>${event.title}</b><br/>${event.city || ""}`))
      .addTo(map);

    (event.nearbyCollectionIds || []).forEach(cid => {
      const cp = (collectionPoints || []).find(p => p.id === cid);
      if (!cp || !cp.lat || !cp.lng) return;
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:22px;height:22px;border-radius:4px;background:#3B82F6;border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;">📦</div>`;
      new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([parseFloat(cp.lng), parseFloat(cp.lat)])
        .setPopup(new mapboxgl.Popup().setHTML(`<b>📦 ${cp.name}</b><br/>${cp.address || ""}`))
        .addTo(map);
    });

    if (event.criticalPointId) {
      const cp = (criticalPoints || []).find(p => p.id === event.criticalPointId);
      if (cp && cp.lat && cp.lng) {
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:22px;height:22px;transform:rotate(45deg);background:#FF3B3B;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 10px #FF3B3B44;"></div>`;
        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([parseFloat(cp.lng), parseFloat(cp.lat)])
          .setPopup(new mapboxgl.Popup().setHTML(`<b><IoWarningOutline style={{color: "yellow"}}/> ${cp.name}</b>`))
          .addTo(map);
      }
    }

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [event, collectionPoints, criticalPoints]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ borderRadius: 8, height: 300, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 28 }}>🗺️</span>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
          Configure <code>VITE_MAPBOX_TOKEN</code> para visualizar o mapa.
        </div>
      </div>
    );
  }

  if (!event.lat || !event.lng) {
    return (
      <div style={{ borderRadius: 8, height: 300, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 28 }}>📍</span>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Evento sem coordenadas registradas.</div>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 8, overflow: "hidden", height: 300 }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

// ─── Aba de fotos do evento ───────────────────────────────────────────────────
function FotosTab({ eventoId, onCountChange, onFotosChange }) {
  const [fotos, setFotos]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [expanded, setExpanded]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const fileInputRef                  = useRef(null);

  useEffect(() => {
    setLoading(true);
    getFotosByEvento(eventoId)
      .then(setFotos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventoId]);

  useEffect(() => {
    if (!loading) {
      onCountChange?.(fotos.length);
      onFotosChange?.(fotos);
    }
  }, [fotos, loading]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const nova = await uploadFoto(eventoId, file);
      setFotos(prev => [...prev, nova]);
    } catch (err) {
      alert("Erro ao enviar foto: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(foto) {
    setConfirmDelete(foto);
  }

  async function confirmDeleteFoto() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deletarFoto(eventoId, confirmDelete.id);
      setFotos(prev => prev.filter(f => f.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      alert("Erro ao remover foto: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary btn-sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Enviando…" : "＋ Adicionar foto"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Carregando fotos…</div>
        </div>
      ) : fotos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdPhotoCamera /></div>
          <div className="empty-state-text">Nenhuma foto registrada para este evento</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {fotos.map(foto => (
            <div
              key={foto.id}
              style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", aspectRatio: "16/9", background: "var(--bg-elevated)" }}
            >
              <img
                src={foto.fotoUrl}
                alt={foto.nomeArquivo || "foto"}
                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in", display: "block" }}
                onClick={() => setExpanded(foto)}
                onError={e => { e.target.style.display = "none"; }}
              />
              <button
                onClick={() => handleDelete(foto)}
                title="Remover foto"
                style={{
                  position: "absolute", top: 6, right: 6,
                  width: 28, height: 28, borderRadius: "50%",
                  border: "1.5px solid rgba(220,38,38,0.85)", background: "rgba(220,38,38,0.45)",
                  color: "#fff", fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(4px)",
                }}
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 600,
          background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "24px 28px", width: 340, maxWidth: "90vw",
            boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Remover foto?</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, wordBreak: "break-all" }}>
              {confirmDelete.nomeArquivo || "Esta foto será removida permanentemente."}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={deleting}
                onClick={confirmDeleteFoto}
              >
                {deleting ? "Removendo…" : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div
          onClick={() => setExpanded(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={expanded.fotoUrl}
            alt={expanded.nomeArquivo || "foto"}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "90vw", maxHeight: "88vh",
              borderRadius: 10, objectFit: "contain",
              boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
              cursor: "default",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Photo strip no card do evento ───────────────────────────────────────────
function EventPhotoStrip({ fotos, onPhotoClick }) {
  const [startIdx, setStartIdx] = useState(0);
  const VISIBLE = 3;
  const hasMore = fotos.length > VISIBLE;
  const canPrev = startIdx > 0;
  const canNext = startIdx + VISIBLE < fotos.length;

  const arrowStyle = (enabled) => ({
    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
    border: "1px solid var(--border)",
    background: enabled ? "var(--bg-elevated)" : "transparent",
    color: enabled ? "var(--text-primary)" : "var(--border)",
    cursor: enabled ? "pointer" : "default",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18,
  });

  if (fotos.length === 0) {
    return (
      <div style={{ height: 84, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}><MdPhotoCamera /> Não há fotos do evento ainda</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 16px 10px" }}>
      {hasMore && (
        <button
          disabled={!canPrev}
          onClick={ev => { ev.stopPropagation(); setStartIdx(i => Math.max(0, i - 1)); }}
          style={arrowStyle(canPrev)}
        >‹</button>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        {fotos.slice(startIdx, startIdx + VISIBLE).map(foto => (
          <div
            key={foto.id}
            onClick={ev => { ev.stopPropagation(); onPhotoClick(foto, fotos); }}
            style={{
              width: 120, height: 68, flexShrink: 0,
              borderRadius: 6, overflow: "hidden",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              cursor: "zoom-in",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <img
              src={foto.fotoUrl}
              alt={foto.nomeArquivo || "foto"}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
              onError={e => { e.target.style.display = "none"; }}
            />
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          disabled={!canNext}
          onClick={ev => { ev.stopPropagation(); setStartIdx(i => Math.min(fotos.length - VISIBLE, i + 1)); }}
          style={arrowStyle(canNext)}
        >›</button>
      )}
      {hasMore && (
        <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
          {startIdx + 1}–{Math.min(startIdx + VISIBLE, fotos.length)}/{fotos.length}
        </span>
      )}
    </div>
  );
}

// ─── Hook: anima linhas da tabela quando o array muda ────────────────────────
function useTableRowAnimation(filtered) {
  const tbodyRef = useRef(null);
  const prevLen  = useRef(0);

  useLayoutEffect(() => {
    if (!tbodyRef.current) return;
    const rows = tbodyRef.current.querySelectorAll("tr");
    if (!rows.length) return;

    if (rows.length === prevLen.current) return;
    prevLen.current = rows.length;

    gsap.fromTo(
      rows,
      { opacity: 0, x: 24 },
      { opacity: 1, x: 0, duration: 0.25, stagger: 0.04, ease: "power2.out" }
    );
  }, [filtered]);

  return tbodyRef;
}

// ─── Drawer de detalhes do evento ─────────────────────────────────────────────
function EventDetailDrawer({ event, collectionPoints, criticalPoints, volunteers, specialists, specialistStatuses, onUpdateStatus, onClose, onEdit, onGoToCollection, convocacoes, onConvocou, onFotosChange }) {
  const [tab, setTab]                   = useState("mapa");
  const [localConvocados, setLocalConvocados] = useState({});
  const [fotosCount, setFotosCount]     = useState(null);
  const drawerRef                       = useRef(null);

  useLayoutEffect(() => {
    if (!drawerRef.current) return;
    gsap.fromTo(
      drawerRef.current,
      { x: 60, opacity: 0 },
      { x: 0,  opacity: 1, duration: 0.28, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    getFotosByEvento(event.id)
      .then(data => setFotosCount(data.length))
      .catch(() => {});
  }, [event.id]);

  const nearbyPoints     = (event.nearbyCollectionIds || []).map(id => (collectionPoints || []).find(p => p.id === id)).filter(p => p && p.status === "validado");
  const activeVolunteers = (event.volunteerIds || []).map(id => (volunteers || []).find(v => v.id === id)).filter(v => v && v.status === "aprovado");
  const linkedCritical   = event.criticalPointId ? (criticalPoints || []).find(p => p.id === event.criticalPointId) : null;
  const neededProfiles   = event.neededProfiles || [];

  // Convocações deste evento vindas do backend (exclui recusados)
  const eventConvMap = new Map(
    (convocacoes || [])
      .filter(c => c.eventoId === event.id && c.status !== "recusado")
      .map(c => [c.especialistaId, c.status])
  );

  function getEffectiveStatus(spec) {
    const espId = spec.especialistaId;
    if (eventConvMap.has(espId))     return eventConvMap.get(espId);
    if (localConvocados[espId])      return localConvocados[espId];
    return (specialistStatuses || {})[String(espId)] || spec.statusCampo || "disponivel";
  }

  // Aba Convocar: profissão compatível, apenas disponíveis (exclui convocados, a caminho e no local)
  const eligibleSpecialists = (specialists || [])
    .filter(s => s.status === "aprovado")
    .filter(s => neededProfiles.length === 0 || neededProfiles.includes(s.profissao))
    .filter(s => getEffectiveStatus(s) === "disponivel");

  // Aba Especialistas: apenas quem tem convocação ativa neste evento
  const assignedSpecialists = (specialists || [])
    .filter(s => s.status === "aprovado")
    .filter(s => eventConvMap.has(s.especialistaId) || !!localConvocados[s.especialistaId]);

  const tabs = [
    { id: "mapa",          label: <><FaMapMarkedAlt style={{color:"lightblue", fontSize:18}} /> Mapa</> },
    { id: "fotos",         label: <><MdPhotoCamera style={{color:"gray", fontSize:18}}/> Fotos{fotosCount !== null ? ` (${fotosCount})` : ""}</> },
    { id: "coleta",        label: <><BsBox2HeartFill style={{color:"#3B82F6", fontSize:18}}/> Coleta ({nearbyPoints.length})</> },
    event.status !== "encerrado" ? { id: "especialistas", label: <><FaStaffSnake style={{color:"#22c55e", fontSize:18}}/> Especialistas ({assignedSpecialists.length})</> } : null,
    event.status !== "encerrado" ? { id: "convocar", label: <> <GoGoal style={{color:"red", fontSize:18}}/> Convocar </> } : null,
  ].filter(Boolean);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", justifyContent: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={drawerRef}
        style={{ width: 580, maxWidth: "95vw", height: "100vh", overflowY: "auto", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column" }}
      >

        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 22 }}>{typeIcon[event.type] || <IoWarningOutline style={{color: "yellow"}}/>}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{event.title}</span>
                {linkedCritical && (
                  <span style={{ background: "rgba(255,59,59,0.15)", color: "#FF3B3B", border: "1px solid rgba(255,59,59,0.3)", borderRadius: 99, fontSize: 10, padding: "2px 8px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    <IoWarningOutline style={{color: "yellow"}}/> PONTO CRÍTICO
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {severityBadge(event.severity)}
                {statusBadge(event.status)}
                {(event.address || event.city) && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    <IoIosPin style={{fontSize:13}}/> {event.address || event.city}
                  </span>
                )}
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}><FaCalendarDays style={{color:"#5e91b5", fontSize:11}}/> {event.date}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {event.status !== "encerrado" && (
                <button className="btn btn-secondary btn-sm" onClick={onEdit}><CiEdit style={{color:"white", fontSize:18}}/> Editar</button>
              )}
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
            {[
              { label: "Vítimas",          value: event.victims,               color: "var(--warning)" },
              { label: "Especialistas",    value: assignedSpecialists.length,  color: "var(--success)" },
              { label: "Pontos de Coleta", value: nearbyPoints.length,         color: "var(--accent2)" },
            ].map((k, i) => (
              <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "10px 14px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {neededProfiles.length > 0 && (
            <div style={{ marginTop: 12, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
                Profissionais necessários ({neededProfiles.length})
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {neededProfiles.map(p => (
                  <span key={p} style={{ background: "rgba(59,130,246,0.1)", color: "var(--accent2)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 99, fontSize: 10, padding: "2px 9px", fontWeight: 600 }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {linkedCritical && (
            <div style={{ marginTop: 12, background: "rgba(255,59,59,0.07)", border: "1px solid rgba(255,59,59,0.25)", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}><IoWarningOutline style={{color: "yellow"}}/></span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#FF3B3B", marginBottom: 2 }}>{linkedCritical.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{linkedCritical.description}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px 0", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map(t => (
              <div key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "7px 14px", borderRadius: "6px 6px 0 0", cursor: "pointer",
                fontSize: 12.5, fontWeight: 600, transition: "all 0.15s",
                color: tab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
                background: tab === t.id ? "var(--bg-elevated)" : "transparent",
                borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              }}>{t.label}</div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>

          {tab === "mapa" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <EventDetailMap event={event} collectionPoints={collectionPoints} criticalPoints={criticalPoints} />
              {event.description && (
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-mono)" }}>Descrição</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{event.description}</div>
                </div>
              )}
            </div>
          )}

          {tab === "fotos" && <FotosTab eventoId={event.id} onCountChange={setFotosCount} onFotosChange={onFotosChange} />}

          {tab === "coleta" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nearbyPoints.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">Nenhum ponto de coleta vinculado</div></div>
              ) : nearbyPoints.map(p => (
                <div
                  key={p.id}
                  onClick={() => { onGoToCollection && onGoToCollection(p.id); onClose(); }}
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>📦</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>📍 {p.address}{p.city ? `, ${p.city}` : ""}</div>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>›</span>
                </div>
              ))}
            </div>
          )}

          {tab === "especialistas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {assignedSpecialists.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">⚕️</div><div className="empty-state-text">Nenhum especialista designado ainda. Use a aba Convocar.</div></div>
              ) : assignedSpecialists.map(s => {
                const color = PROF_COLORS[s.profissao] || "#71717a";
                const effStatus = getEffectiveStatus(s);
                const st = FIELD_STATUS_MAP[effStatus] || FIELD_STATUS_MAP.disponivel;
                return (
                  <div key={s.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", flexShrink: 0 }}>
                      {s.nome.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.nome}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.profissao}{s.uf ? ` · ${s.uf}` : ""}</div>
                    </div>
                    <span style={{ backgroundColor: st.bg, color: st.color, borderRadius: 99, fontSize: 10, fontWeight: 600, padding: "3px 10px", flexShrink: 0, whiteSpace: "nowrap" }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "convocar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                {neededProfiles.length > 0
                  ? `Especialistas compatíveis com as ${neededProfiles.length} profissão(ões) requerida(s)`
                  : "Todos os especialistas aprovados"}
              </div>
              {eligibleSpecialists.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">⚕️</div>
                  <div className="empty-state-text">Nenhum especialista aprovado{neededProfiles.length > 0 ? " e compatível" : ""} cadastrado.</div>
                </div>
              ) : (
                eligibleSpecialists.map(s => (
                  <SpecialistAssignRow
                    key={s.id}
                    spec={s}
                    effectiveStatus={getEffectiveStatus(s)}
                    onAssign={async () => {
                      try {
                        await convocarManual(event.id, s.especialistaId);
                      } catch (e) {
                        alert("Erro ao convocar: " + e.message);
                        return;
                      }
                      // Feedback imediato; onConvocou recarrega do backend em seguida
                      setLocalConvocados(prev => ({ ...prev, [s.especialistaId]: "pendente" }));
                      onConvocou && onConvocou();
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EventsSection ─────────────────────────────────────────────────────────────
export default function EventsSection({ events, onSaveEvent, criticalPoints, collectionPoints, volunteers, specialists, specialistStatuses, onUpdateStatus, openEventId, onEventOpened, onGoToCollection, convocacoes, onConvocou }) {
  const [filter, setFilter]             = useState("ativo");
  const [search, setSearch]             = useState("");
  const [editEvent, setEditEvent]       = useState(null);
  const [showNew, setShowNew]           = useState(false);
  const [detailEvent, setDetailEvent]   = useState(null);
  const [closureEvent, setClosureEvent]   = useState(null);
  const [eventPhotos, setEventPhotos]     = useState({});
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const fetchedPhotoIds                   = useRef(new Set());
  const [hoveredEventId, setHoveredEventId] = useState(null);
  const cardRef                           = useRef(null);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }
    );
  }, []);

  // Abre automaticamente o drawer quando navegado via "Ver mais" no Campo
  useEffect(() => {
    if (!openEventId || events.length === 0) return;
    const evt = events.find(e => String(e.id) === String(openEventId));
    if (evt) {
      setDetailEvent(evt);
      if (onEventOpened) onEventOpened();
    }
  }, [openEventId, events]);

  useEffect(() => {
    events.forEach(evt => {
      if (!fetchedPhotoIds.current.has(evt.id)) {
        fetchedPhotoIds.current.add(evt.id);
        getFotosByEvento(evt.id)
          .then(fotos => setEventPhotos(prev => ({ ...prev, [evt.id]: fotos })))
          .catch(() => setEventPhotos(prev => ({ ...prev, [evt.id]: [] })));
      }
    });
  }, [events]);

  const severityOrder = { critico: 0, alto: 1, medio: 2, baixo: 3 };
  const criticalIds   = new Set((criticalPoints || []).map(p => p.id));

  const filtered = events
    .filter(e => filter === "todos" || e.status === filter)
    .filter(e =>
      (e.title   || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.city    || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.address || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aIsCritical = a.criticalPointId && criticalIds.has(a.criticalPointId) ? 0 : 1;
      const bIsCritical = b.criticalPointId && criticalIds.has(b.criticalPointId) ? 0 : 1;
      if (aIsCritical !== bIsCritical) return aIsCritical - bIsCritical;
      return (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
    });

  const tbodyRef = useTableRowAnimation(filtered);

  return (
    <>
      <style>{`
        @keyframes warning-pulse {
          0%, 100% { color: yellow; opacity: 1; }
          50%       { color: #b8860b; opacity: 0.45; }
        }
        .icon-warning-pulse { animation: warning-pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div ref={cardRef} className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📋 Gerenciar Eventos Oficiais</div>
            <div className="card-subtitle">Cadastro e atualização de desastres · clique na linha para detalhes</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>＋ Novo Evento</button>
        </div>

        <div className="filter-row">
          {["ativo", "monitoramento", "controlado", "encerrado"].map(f => (
            <span key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </span>
          ))}
          <input className="search-input" placeholder="🔍 Buscar evento..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌊</div>
              <div className="empty-state-text">Nenhum evento encontrado</div>
            </div>
          ) : (
            <table style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th>Evento</th><th>Tipo</th><th>Severidade</th><th>Status</th>
                  <th>Vítimas</th><th>Data</th><th>Ações</th>
                </tr>
              </thead>
              <tbody ref={tbodyRef}>
                {filtered.map(e => {
                  const isOnCritical   = e.criticalPointId && criticalIds.has(e.criticalPointId);
                  const neededProfiles = e.neededProfiles || [];
                  const rowPhotos      = eventPhotos[e.id];
                  const hasPhotos      = Array.isArray(rowPhotos);
                  return (
                    <Fragment key={e.id}>
                    <tr
                      onClick={() => setDetailEvent(e)}
                      onMouseEnter={() => setHoveredEventId(e.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                      style={{ cursor: "pointer", background: hoveredEventId === e.id ? "var(--bg-hover)" : "transparent" }}
                    >
                      <td style={{ borderTop: "1px solid var(--border)", borderLeft: "1px solid var(--border)", borderBottom: "none", borderRadius: "6px 0 0 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isOnCritical && <IoWarningOutline title="Evento em ponto crítico" className="icon-warning-pulse" style={{ fontSize: 25, flexShrink: 0}} />}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 18 }}>{e.title}</div>
                            <div className="text-muted text-sm mono">📍 {e.address || e.city}</div>
                            {neededProfiles.length > 0 && (
                              <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 3 }}>
                                {neededProfiles.slice(0, 3).map(p => (
                                  <span key={p} style={{ background: "rgba(59,130,246,0.1)", color: "var(--accent2)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 4, fontSize: 9, padding: "1px 5px" }}>{p}</span>
                                ))}
                                {neededProfiles.length > 3 && (
                                  <span style={{ fontSize: 9, color: "var(--text-muted)", padding: "1px 3px" }}>+{neededProfiles.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}><span style={{ fontSize: 18 }}>{typeIcon[e.type] || <IoWarningOutline style={{color: "yellow"}}/>}</span></td>
                      <td style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>{severityBadge(e.severity)}</td>
                      <td style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>{statusBadge(e.status)}</td>
                      <td style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}><span className="mono" style={{ color: "var(--warning)" }}>{e.victims}</span></td>
                      <td style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}><span className="mono text-secondary text-sm">{e.date}</span></td>
                      <td style={{ borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "none", borderRadius: "0 6px 0 0" }}>
                        <div className="btn-group" onClick={ev => ev.stopPropagation()}>
                          {e.status !== "encerrado" && (
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              onClick={() => setEditEvent(e)}
                              title="Editar"
                            >
                              <CiEdit style={{color:"white", fontSize:20}}/>
                            </button>
                          )}
                          {e.status === "encerrado" && (
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Emitir relatório"
                              onClick={() => setClosureEvent({
                                event: e,
                                snapshot: convocacoes.filter(
                                  c => String(c.eventoId) === String(e.id)
                                ),
                              })}
                            >
                              📄 Relatório
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {hasPhotos && (
                      <tr
                        onClick={() => setDetailEvent(e)}
                        onMouseEnter={() => setHoveredEventId(e.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                        style={{ cursor: "pointer", background: hoveredEventId === e.id ? "var(--bg-hover)" : "transparent" }}
                      >
                        <td colSpan={7} style={{ padding: 0, borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", borderRadius: "0 0 6px 6px" }}>
                          <EventPhotoStrip fotos={rowPhotos} onPhotoClick={(foto, fotos) => setLightboxPhoto({ fotos, idx: fotos.findIndex(f => f.id === foto.id) })} />
                        </td>
                      </tr>
                    )}
                    <tr aria-hidden="true">
                      <td colSpan={7} style={{ padding: 0, height: 8, border: "none" }} />
                    </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {detailEvent && (
        <EventDetailDrawer
          event={detailEvent}
          collectionPoints={collectionPoints}
          criticalPoints={criticalPoints}
          volunteers={volunteers}
          specialists={specialists}
          specialistStatuses={specialistStatuses}
          onUpdateStatus={onUpdateStatus}
          onClose={() => setDetailEvent(null)}
          onEdit={() => { setEditEvent(detailEvent); setDetailEvent(null); }}
          onGoToCollection={onGoToCollection}
          convocacoes={convocacoes}
          onConvocou={onConvocou}
          onFotosChange={(fotos) => setEventPhotos(prev => ({ ...prev, [detailEvent.id]: fotos }))}
        />
      )}

      {(showNew || editEvent) && (
        <EventModal
          event={editEvent}
          onClose={() => { setShowNew(false); setEditEvent(null); }}
          onSave={async (form) => {
            if (!editEvent && form.type && form.address) {
              const dup = (events || []).find(e =>
                e.status !== "encerrado" &&
                e.type === form.type &&
                (e.address || "").trim().toLowerCase() === form.address.trim().toLowerCase()
              );
              if (dup) throw new Error(`Já existe um evento ativo do tipo "${form.type}" neste endereço.`);
            }

            const prevStatus = editEvent?.status;
            const convSnapshot =
              form.status === "encerrado" && prevStatus !== "encerrado"
                ? [...convocacoes]
                : [];

            const saved = await onSaveEvent(editEvent, form);

            if (form.status === "encerrado" && prevStatus !== "encerrado") {
              setClosureEvent({
                event:    saved ?? { ...editEvent, ...form },
                snapshot: convSnapshot,
              });
            }

            setShowNew(false);
            setEditEvent(null);
          }}
        />
      )}

      {closureEvent && (
        <EventClosureModal
          event={closureEvent.event}
          specialists={specialists}
          collectionPoints={collectionPoints}
          convocacoes={closureEvent.snapshot}
          onClose={() => setClosureEvent(null)}
        />
      )}

      {lightboxPhoto && (() => {
        const current  = lightboxPhoto.fotos[lightboxPhoto.idx];
        const canPrev  = lightboxPhoto.idx > 0;
        const canNext  = lightboxPhoto.idx < lightboxPhoto.fotos.length - 1;
        const navStyle = (enabled) => ({
          position: "absolute", top: "50%", transform: "translateY(-50%)",
          width: 48, height: 48, borderRadius: "50%",
          background: enabled ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.25)",
          color: enabled ? "#fff" : "rgba(255,255,255,0.25)",
          fontSize: 28, cursor: enabled ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)", transition: "background 0.15s",
        });
        return (
          <div
            onClick={() => setLightboxPhoto(null)}
            style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}
          >
            <button
              onClick={ev => { ev.stopPropagation(); if (canPrev) setLightboxPhoto(p => ({ ...p, idx: p.idx - 1 })); }}
              style={{ ...navStyle(canPrev), left: 24 }}
            >‹</button>

            <img
              src={current.fotoUrl}
              alt={current.nomeArquivo || "foto"}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "80vw", maxHeight: "88vh", borderRadius: 10, objectFit: "contain", boxShadow: "0 8px 48px rgba(0,0,0,0.6)", cursor: "default" }}
            />

            <button
              onClick={ev => { ev.stopPropagation(); if (canNext) setLightboxPhoto(p => ({ ...p, idx: p.idx + 1 })); }}
              style={{ ...navStyle(canNext), right: 24 }}
            >›</button>

            {lightboxPhoto.fotos.length > 1 && (
              <span onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-mono)", pointerEvents: "none" }}>
                {lightboxPhoto.idx + 1} / {lightboxPhoto.fotos.length}
              </span>
            )}
          </div>
        );
      })()}
    </>
  );
}
