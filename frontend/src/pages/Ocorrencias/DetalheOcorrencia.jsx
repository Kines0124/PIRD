import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../utils/geocoding.js";
import Tag from "../../components/Tag";
import PriorityBar from "../../components/PriorityBar";
import { mockDemands } from "../../data/demands";
import { mockVolunteers } from "../../data/volunteers";
import { mockPoints } from "../../data/points";
import { severityColor, severityLabel, statusColor, categoryColors } from "../../constants/theme";

function MiniMap({ lat, lng, title }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 15,
      interactive: false,
    });
    mapRef.current = map;

    map.on("style.load", () => {
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:20px;height:20px;border-radius:50%;background:#de393f;border:3px solid #fff;box-shadow:0 0 10px rgba(222,57,63,0.55);"></div>`;
      new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [lat, lng]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ height: 120, background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Mapa indisponível — configure VITE_MAPBOX_TOKEN</span>
      </div>
    );
  }

  return (
    <div style={{ height: 120, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default function DetalheOcorrencia({ evento, perfil, onVoltar }) {
  const [aba, setAba] = useState("necessidades");
  const demandas   = mockDemands.filter(d => d.event === evento.id);
  const voluntarios = mockVolunteers.filter(v => v.eventId === evento.id);
  const pontos     = mockPoints.filter(p => p.events.includes(evento.id));

  return (
    <div className="dot-bg" style={{ padding: "28px 32px" }}>
      <button onClick={onVoltar} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0, fontFamily: "var(--font-mono)" }}>
        ← Voltar para Ocorrências
      </button>

      <div style={{ background: "var(--bg-surface)", border: `1px solid ${severityColor[evento.severity]}30`, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: `${severityColor[evento.severity]}10`, padding: "20px 24px", borderBottom: `1px solid ${severityColor[evento.severity]}20`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Tag color={statusColor[evento.status]}>{evento.status}</Tag>
              <Tag color={severityColor[evento.severity]}>{severityLabel[evento.severity]}</Tag>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "0.02em" }}>{evento.title}</h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{evento.desc}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>📅 {evento.date} · 📍 {evento.lat}, {evento.lng}</div>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 800, color: severityColor[evento.severity], lineHeight: 1 }}>S{evento.severity}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <div style={{ padding: "16px 20px", borderRight: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>🗺 Mapa da Ocorrência</div>
            <MiniMap lat={evento.lat} lng={evento.lng} title={evento.title} />
          </div>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>📷 Foto da Ocorrência</div>
            <div
              style={{ height: 120, background: "var(--bg-elevated)", borderRadius: 10, border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-strong)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}>ADICIONAR FOTO</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", background: "var(--bg-surface)", borderRadius: 12, marginBottom: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
        {[
          { id: "necessidades", label: `Necessidades (${demandas.length})` },
          { id: "coleta",       label: `Pontos de Coleta (${pontos.length})` },
          { id: "voluntarios",  label: `Voluntários (${voluntarios.length})` },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{ flex: 1, padding: "12px", border: "none", background: "transparent", cursor: "pointer", color: aba === a.id ? "var(--red)" : "var(--text-muted)", fontSize: 12, fontWeight: 700, borderBottom: aba === a.id ? "2px solid var(--red)" : "2px solid transparent", fontFamily: "var(--font-mono)" }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "necessidades" && (
        <div style={{ display: "grid", gap: 10 }}>
          {demandas.map(d => (
            <div key={d.id} style={{ background: "var(--bg-surface)", border: `1px solid ${d.priority >= 5 ? "rgba(222,57,63,0.3)" : "var(--border)"}`, borderRadius: 12, padding: "16px 20px", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `${categoryColors[d.category]}14`, border: `1px solid ${categoryColors[d.category]}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: categoryColors[d.category], fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {d.category.slice(0, 3)}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{d.item}</span>
                  <Tag color={d.priority >= 5 ? "#de393f" : d.priority >= 4 ? "#f97316" : "#f5c518"}>
                    {d.priority >= 5 ? "URGENTE" : d.priority >= 4 ? "Alto" : "Médio"}
                  </Tag>
                </div>
                <PriorityBar needed={d.needed} supplied={d.supplied} priority={d.priority} />
              </div>
              {perfil === "defesa" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, padding: "6px 12px", color: "var(--success)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Suficiente</button>
                  <button style={{ background: "rgba(222,57,63,0.1)", border: "1px solid rgba(222,57,63,0.25)", borderRadius: 8, padding: "6px 12px", color: "var(--red)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Urgente</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {aba === "coleta" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {pontos.map(p => (
            <div key={p.id} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px" }}>
              <Tag color={p.type === "Fixo" ? "var(--blue-info)" : "#8b5cf6"}>{p.type}</Tag>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 8, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📍 {p.address}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>📞 {p.contact}</div>
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                {p.items.map(it => (
                  <span key={it} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>{it}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === "voluntarios" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {voluntarios.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Nenhum voluntário vinculado.</div>
          )}
          {voluntarios.map(v => (
            <div key={v.id} style={{ background: "var(--bg-surface)", border: `1px solid ${v.available ? "rgba(34,197,94,0.25)" : "var(--border)"}`, borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: v.available ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)", border: `2px solid ${v.available ? "#22c55e" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {v.specialty.includes("Médic") || v.specialty.includes("Enfer") ? "⚕️"
                  : v.specialty.includes("Engenh") ? "🔧"
                  : v.specialty.includes("Psicól") ? "🧠"
                  : "🚗"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{v.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{v.specialty} · {v.location}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{v.ref}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.available ? "var(--success)" : "var(--text-muted)", boxShadow: v.available ? "0 0 6px #22c55e" : "none" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
