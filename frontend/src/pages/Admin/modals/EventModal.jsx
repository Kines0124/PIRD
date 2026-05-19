import { useState } from "react";
import { SEVERITY_OPTIONS } from "../adminTheme.jsx";

export default function EventModal({ event, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    type: "enchente",
    severity: "medio",
    city: "",
    address: "",
    lat: "",
    lng: "",
    description: "",
    status: "ativo",
    photos: [],
    criticalPointId: null,
    nearbyCollectionIds: [],
    volunteerIds: [],
    ...event,
  });

  const [geoStatus, setGeoStatus] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function geocodificar() {
    if (!form.address.trim()) return;
    setGeoStatus("buscando");
    try {
      const query = encodeURIComponent(form.address);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
      const data = await res.json();
      if (data.length === 0) { setGeoStatus("erro"); return; }
      const { lat, lon, display_name } = data[0];
      setForm(f => ({
        ...f,
        lat: parseFloat(lat).toFixed(6),
        lng: parseFloat(lon).toFixed(6),
        city: f.city || display_name.split(",").slice(-3, -1).join(",").trim(),
      }));
      setGeoStatus("ok");
    } catch {
      setGeoStatus("erro");
    }
  }

  const canSave = form.title.trim() && form.lat && form.lng;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{event ? "Editar Evento" : "Cadastrar Novo Evento"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          <div className="form-group">
            <label className="form-label">Título do Evento *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Ex: Enchente Rio Paraíba"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="enchente">🌊 Enchente</option>
                <option value="deslizamento">⛰️ Deslizamento</option>
                <option value="alagamento">💧 Alagamento</option>
                <option value="incendio">🔥 Incêndio</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="monitoramento">Monitoramento</option>
                <option value="controlado">Controlado</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Severidade *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {SEVERITY_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => set("severity", opt.value)}
                  style={{
                    padding: "8px 0",
                    borderRadius: 8,
                    border: `2px solid ${form.severity === opt.value ? opt.color : "var(--border)"}`,
                    background: form.severity === opt.value ? opt.bg : "var(--bg-elevated)",
                    color: form.severity === opt.value ? opt.color : "var(--text-muted)",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 2 }}>
                    {opt.value === "critico" ? "🔴" : opt.value === "alto" ? "🟠" : opt.value === "medio" ? "🟡" : "🟢"}
                  </div>
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cidade / UF</label>
            <input
              className="form-input"
              value={form.city}
              onChange={e => set("city", e.target.value)}
              placeholder="Ex: Taubaté, SP"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                value={form.address}
                onChange={e => { set("address", e.target.value); setGeoStatus(null); }}
                placeholder="Ex: Av. Charles Schnneider"
                onKeyDown={e => e.key === "Enter" && geocodificar()}
              />
              <button
                className="btn btn-secondary"
                onClick={geocodificar}
                disabled={geoStatus === "buscando" || !form.address.trim()}
                style={{ flexShrink: 0, opacity: !form.address.trim() ? 0.4 : 1 }}
              >
                {geoStatus === "buscando" ? "📡…" : "📍 Geocodificar"}
              </button>
            </div>
            {geoStatus === "ok"   && <div style={{ fontSize: 11, color: "var(--success)",    marginTop: 5 }}>✓ Coordenadas obtidas com sucesso via OpenStreetMap</div>}
            {geoStatus === "erro" && <div style={{ fontSize: 11, color: "var(--danger)",     marginTop: 5 }}>✗ Endereço não encontrado — tente ser mais específico ou insira as coordenadas manualmente</div>}
            {geoStatus === null   && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Digite o endereço completo e clique em Geocodificar para obter as coordenadas automaticamente.</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                className="form-input mono"
                value={form.lat}
                readOnly
                placeholder="— preenchido automaticamente —"
                style={{ color: form.lat ? "var(--accent2)" : "var(--text-muted)", cursor: "default", opacity: 0.8 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                className="form-input mono"
                value={form.lng}
                readOnly
                placeholder="— preenchido automaticamente —"
                style={{ color: form.lng ? "var(--accent2)" : "var(--text-muted)", cursor: "default", opacity: 0.8 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Detalhes sobre o evento..."
            />
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.4 }}
            onClick={() => { onSave(form); onClose(); }}
          >
            💾 Salvar Evento
          </button>
        </div>
      </div>
    </div>
  );
}
