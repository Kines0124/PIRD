import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Tag from "../../components/Tag";
import PriorityBar from "../../components/PriorityBar";
import { mockDemands } from "../../data/demands";
import { mockVolunteers } from "../../data/volunteers";
import { mockPoints } from "../../data/points";
import { severityColor, severityLabel, statusColor, categoryColors } from "../../constants/theme";

export default function DetalheOcorrencia({ evento, perfil, onVoltar }) {
  const [aba, setAba] = useState("necessidades");
  const demandas = mockDemands.filter(d => d.event === evento.id);
  const voluntarios = mockVolunteers.filter(v => v.eventId === evento.id);
  const pontos = mockPoints.filter(p => p.events.includes(evento.id));

  return (
    <div style={{ padding: "28px 32px" }}>
      <button onClick={onVoltar} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}>
        ← Voltar para Ocorrências
      </button>

      <div style={{ background: "#0a1628", border: `1px solid ${severityColor[evento.severity]}30`, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
        <div style={{
          background: `${severityColor[evento.severity]}10`,
          padding: "20px 24px",
          borderBottom: `1px solid ${severityColor[evento.severity]}20`,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Tag color={statusColor[evento.status]}>{evento.status}</Tag>
              <Tag color={severityColor[evento.severity]}>{severityLabel[evento.severity]}</Tag>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", margin: "0 0 6px" }}>{evento.title}</h2>
            <div style={{ fontSize: 13, color: "#64748b" }}>{evento.desc}</div>
            <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>📅 {evento.date} · 📍 {evento.lat}, {evento.lng}</div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: severityColor[evento.severity], fontFamily: "monospace" }}>S{evento.severity}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <div style={{ padding: "16px 20px", borderRight: "1px solid #0f2040" }}>
            <div style={{ fontSize: 10, color: "#334155", letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>🗺 MAPA DA OCORRÊNCIA</div>
            <div style={{ height: 120, borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
              <MapContainer center={[evento.lat, evento.lng]} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[evento.lat, evento.lng]}><Popup>{evento.title}</Popup></Marker>
              </MapContainer>
            </div>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 10, color: "#334155", letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>📷 FOTO DA OCORRÊNCIA</div>
            <div
              style={{ height: 120, background: "#050e1a", borderRadius: 10, border: "2px dashed #1e293b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#0ea5e940"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                <div style={{ fontSize: 11, color: "#334155", fontFamily: "monospace" }}>ADICIONAR FOTO</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", background: "#0a1628", borderRadius: 12, marginBottom: 16, overflow: "hidden", border: "1px solid #0f2040" }}>
        {[
          { id: "necessidades", label: `Necessidades (${demandas.length})` },
          { id: "coleta", label: `Pontos de Coleta (${pontos.length})` },
          { id: "voluntarios", label: `Voluntários (${voluntarios.length})` },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            flex: 1, padding: "12px", border: "none", background: "transparent", cursor: "pointer",
            color: aba === a.id ? "#ff3b3b" : "#475569", fontSize: 12, fontWeight: 700,
            borderBottom: aba === a.id ? "2px solid #ff3b3b" : "2px solid transparent",
            fontFamily: "monospace",
          }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Aba: Necessidades */}
      {aba === "necessidades" && (
        <div style={{ display: "grid", gap: 10 }}>
          {demandas.map(d => (
            <div key={d.id} style={{
              background: "#0a1628",
              border: `1px solid ${d.priority >= 5 ? "#ef444430" : "#0f2040"}`,
              borderRadius: 12, padding: "16px 20px",
              display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: `${categoryColors[d.category]}15`,
                border: `1px solid ${categoryColors[d.category]}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: categoryColors[d.category], fontWeight: 700,
              }}>{d.category.slice(0, 3)}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>{d.item}</span>
                  <Tag color={d.priority >= 5 ? "#ef4444" : d.priority >= 4 ? "#f97316" : "#eab308"}>
                    {d.priority >= 5 ? "URGENTE" : d.priority >= 4 ? "Alto" : "Médio"}
                  </Tag>
                </div>
                <PriorityBar needed={d.needed} supplied={d.supplied} priority={d.priority} />
              </div>
              {perfil === "defesa" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ background: "#10b98115", border: "1px solid #10b98130", borderRadius: 8, padding: "6px 12px", color: "#10b981", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Suficiente</button>
                  <button style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, padding: "6px 12px", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Urgente</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Aba: Pontos de Coleta */}
      {aba === "coleta" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {pontos.map(p => (
            <div key={p.id} style={{ background: "#0a1628", border: "1px solid #0f2040", borderRadius: 12, padding: "16px" }}>
              <Tag color={p.type === "Fixo" ? "#0ea5e9" : "#8b5cf6"}>{p.type}</Tag>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginTop: 8, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>📍 {p.address}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>📞 {p.contact}</div>
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                {p.items.map(it => (
                  <span key={it} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "#1e293b", color: "#64748b" }}>{it}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aba: Voluntários */}
      {aba === "voluntarios" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {voluntarios.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 32, color: "#334155" }}>Nenhum voluntário vinculado.</div>
          )}
          {voluntarios.map(v => (
            <div key={v.id} style={{
              background: "#0a1628",
              border: `1px solid ${v.available ? "#10b98130" : "#0f2040"}`,
              borderRadius: 12, padding: "16px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: v.available ? "#10b98120" : "#1e293b",
                border: `2px solid ${v.available ? "#10b981" : "#334155"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>
                {v.specialty.includes("Médic") || v.specialty.includes("Enfer") ? "⚕️"
                  : v.specialty.includes("Engenh") ? "🔧"
                  : v.specialty.includes("Psicól") ? "🧠"
                  : "🚗"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{v.name}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{v.specialty} · {v.location}</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{v.ref}</div>
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: v.available ? "#10b981" : "#475569",
                boxShadow: v.available ? "0 0 6px #10b981" : "none",
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
