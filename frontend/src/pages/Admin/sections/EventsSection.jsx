import { useState, useEffect, useRef } from "react";
import { severityColor, typeIcon, riskColor, severityBadge, statusBadge } from "../adminTheme.jsx";
import EventModal from "../modals/EventModal.jsx";

// ─── Mini-mapa do drawer ───────────────────────────────────────────────────────
function EventDetailMap({ event, collectionPoints, criticalPoints }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }

    const L = window.L;
    const map = L.map(mapRef.current, { center: [event.lat, event.lng], zoom: 13, zoomControl: true });
    instanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 18,
    }).addTo(map);

    const color = severityColor[event.severity] || "#FF6B1A";
    const eventIcon = L.divIcon({
      className: "",
      html: `<div style="width:34px;height:34px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 16px ${color}88;">${typeIcon[event.type] || "⚠️"}</div>`,
      iconSize: [34, 34], iconAnchor: [17, 17],
    });
    L.marker([event.lat, event.lng], { icon: eventIcon }).addTo(map)
      .bindPopup(`<b>${event.title}</b><br/>${event.city}`)
      .openPopup();

    (event.nearbyCollectionIds || []).forEach(cid => {
      const cp = (collectionPoints || []).find(p => p.id === cid);
      if (!cp) return;
      const cpIcon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:4px;background:#3B82F6;border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;">📦</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      });
      L.marker([cp.lat, cp.lng], { icon: cpIcon }).addTo(map)
        .bindPopup(`<b>📦 ${cp.name}</b><br/>${cp.address}`);
    });

    if (event.criticalPointId) {
      const cp = (criticalPoints || []).find(p => p.id === event.criticalPointId);
      if (cp) {
        const cpIcon = L.divIcon({
          className: "",
          html: `<div style="width:22px;height:22px;transform:rotate(45deg);background:#FF3B3B;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 10px #FF3B3B44;"></div>`,
          iconSize: [22, 22], iconAnchor: [11, 11],
        });
        L.marker([cp.lat, cp.lng], { icon: cpIcon }).addTo(map)
          .bindPopup(`<b>⚠️ ${cp.name}</b><br/>${cp.description}`);
      }
    }

    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; } };
  }, [event, collectionPoints, criticalPoints]);

  return (
    <div style={{ borderRadius: 8, overflow: "hidden", height: 300 }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

// ─── Drawer de detalhes do evento ─────────────────────────────────────────────
function EventDetailDrawer({ event, collectionPoints, criticalPoints, volunteers, onClose, onEdit }) {
  const [tab, setTab] = useState("mapa");

  const nearbyPoints     = (event.nearbyCollectionIds || []).map(id => (collectionPoints || []).find(p => p.id === id)).filter(p => p && p.status === "validado");
  const activeVolunteers = (event.volunteerIds || []).map(id => (volunteers || []).find(v => v.id === id)).filter(v => v && v.status === "aprovado");
  const linkedCritical   = event.criticalPointId ? (criticalPoints || []).find(p => p.id === event.criticalPointId) : null;

  const tabs = [
    { id: "mapa",         label: "🗺️ Mapa" },
    { id: "fotos",        label: `📷 Fotos${event.photos?.length ? ` (${event.photos.length})` : ""}` },
    { id: "coleta",       label: `📦 Coleta (${nearbyPoints.length})` },
    { id: "voluntarios",  label: `🙋 Voluntários (${activeVolunteers.length})` },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", justifyContent: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: 580, maxWidth: "95vw", height: "100vh", overflowY: "auto",
        background: "var(--bg-surface)", borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        animation: "slideInRight 0.22s ease",
      }}>

        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 22 }}>{typeIcon[event.type] || "⚠️"}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{event.title}</span>
                {linkedCritical && (
                  <span style={{ background: "rgba(255,59,59,0.15)", color: "#FF3B3B", border: "1px solid rgba(255,59,59,0.3)", borderRadius: "99px", fontSize: 10, padding: "2px 8px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    ⚠️ PONTO CRÍTICO
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {severityBadge(event.severity)}
                {statusBadge(event.status)}
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📍 {event.city}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📅 {event.date}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={onEdit}>✏️ Editar</button>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
            {[
              { label: "Vítimas",          value: event.victims,              color: "var(--warning)" },
              { label: "Voluntários",      value: activeVolunteers.length,    color: "var(--success)" },
              { label: "Pontos de Coleta", value: nearbyPoints.length,        color: "var(--accent2)" },
            ].map((k, i) => (
              <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "10px 14px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {linkedCritical && (
            <div style={{ marginTop: 12, background: "rgba(255,59,59,0.07)", border: "1px solid rgba(255,59,59,0.25)", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
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

          {tab === "fotos" && (
            <div>
              {!event.photos || event.photos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📷</div>
                  <div className="empty-state-text">Nenhuma foto registrada para este evento</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {event.photos.map((url, i) => (
                    <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", aspectRatio: "16/9", background: "var(--bg-elevated)" }}>
                      <img src={url} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "coleta" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nearbyPoints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-text">Nenhum ponto de coleta vinculado</div>
                </div>
              ) : nearbyPoints.map(p => (
                <div key={p.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>📍 {p.address}, {p.city}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "voluntarios" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeVolunteers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🙋</div>
                  <div className="empty-state-text">Nenhum voluntário vinculado a este evento</div>
                </div>
              ) : activeVolunteers.map((v, i) => {
                const colors = ["linear-gradient(135deg,#FF6B1A,#FF3B3B)", "linear-gradient(135deg,#3B82F6,#8B5CF6)", "linear-gradient(135deg,#22c55e,#16a34a)", "linear-gradient(135deg,#F5C518,#FF8C00)"];
                return (
                  <div key={v.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{v.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v.specialty}</div>
                    </div>
                    {statusBadge(v.status)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EventsSection ─────────────────────────────────────────────────────────────
export default function EventsSection({ events, onSaveEvent, criticalPoints, collectionPoints, volunteers }) {
  const [filter, setFilter]       = useState("todos");
  const [search, setSearch]       = useState("");
  const [editEvent, setEditEvent] = useState(null);
  const [showNew, setShowNew]     = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  const severityOrder = { critico: 0, alto: 1, medio: 2, baixo: 3 };
  const criticalIds   = new Set((criticalPoints || []).map(p => p.id));

  const filtered = events
    .filter(e => filter === "todos" || e.status === filter)
    .filter(e =>
      (e.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.city  || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aIsCritical = a.criticalPointId && criticalIds.has(a.criticalPointId) ? 0 : 1;
      const bIsCritical = b.criticalPointId && criticalIds.has(b.criticalPointId) ? 0 : 1;
      if (aIsCritical !== bIsCritical) return aIsCritical - bIsCritical;
      return (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
    });

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📋 Gerenciar Eventos Oficiais</div>
            <div className="card-subtitle">RF01, RF02 — Cadastro e atualização de desastres · clique na linha para detalhes</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>＋ Novo Evento</button>
        </div>

        <div className="filter-row">
          {["todos", "ativo", "monitoramento", "controlado"].map(f => (
            <span key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </span>
          ))}
          <input
            className="search-input"
            placeholder="🔍 Buscar evento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌊</div>
              <div className="empty-state-text">Nenhum evento encontrado</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Evento</th><th>Tipo</th><th>Severidade</th><th>Status</th>
                  <th>Vítimas</th><th>Data</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const isOnCritical = e.criticalPointId && criticalIds.has(e.criticalPointId);
                  return (
                    <tr key={e.id} onClick={() => setDetailEvent(e)} style={{ cursor: "pointer" }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isOnCritical && <span title="Evento em ponto crítico" style={{ fontSize: 12, color: "#FF3B3B", flexShrink: 0 }}>⚠️</span>}
                          <div>
                            <div style={{ fontWeight: 600 }}>{e.title}</div>
                            <div className="text-muted text-sm mono">📍 {e.city}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 18 }}>{typeIcon[e.type]}</span></td>
                      <td>{severityBadge(e.severity)}</td>
                      <td>{statusBadge(e.status)}</td>
                      <td><span className="mono" style={{ color: "var(--warning)" }}>{e.victims}</span></td>
                      <td><span className="mono text-secondary text-sm">{e.date}</span></td>
                      <td>
                        <div className="btn-group" onClick={ev => ev.stopPropagation()}>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditEvent(e)} title="Editar">✏️</button>
                        </div>
                      </td>
                    </tr>
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
          onClose={() => setDetailEvent(null)}
          onEdit={() => { setEditEvent(detailEvent); setDetailEvent(null); }}
        />
      )}

      {(showNew || editEvent) && (
        <EventModal
          event={editEvent}
          onClose={() => { setShowNew(false); setEditEvent(null); }}
          onSave={form => onSaveEvent && onSaveEvent(editEvent, form)}
        />
      )}
    </>
  );
}
