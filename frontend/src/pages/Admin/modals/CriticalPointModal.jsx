import { useState } from "react";

export default function CriticalPointModal({ point, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    type: "geologico",
    risk: "alto",
    address: "",
    city: "",
    lat: "",
    lng: "",
    description: "",
    ...point,
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
      const { lat, lon } = data[0];
      setForm(f => ({
        ...f,
        lat: parseFloat(lat).toFixed(6),
        lng: parseFloat(lon).toFixed(6),
      }));
      setGeoStatus("ok");
    } catch {
      setGeoStatus("erro");
    }
  }

  const canSave = form.name.trim() && form.lat && form.lng;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{point ? "Editar Ponto Crítico" : "Cadastrar Ponto Crítico"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div className="form-group">
            <label className="form-label">Nome do Ponto *</label>
            <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex: Encosta Bairro Norte" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de Risco</label>
              <select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="geologico">Geológico</option>
                <option value="hidrologico">Hidrológico</option>
                <option value="infraestrutura">Infraestrutura</option>
                <option value="quimico">Químico</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nível de Risco</label>
              <select className="form-select" value={form.risk} onChange={e => set("risk", e.target.value)}>
                <option value="critico">Crítico</option>
                <option value="alto">Alto</option>
                <option value="medio">Médio</option>
              </select>
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
                placeholder="Ex: Encosta Norte"
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
            {geoStatus === "ok"   && <div style={{ fontSize: 11, color: "var(--success)",    marginTop: 5 }}>✓ Coordenadas obtidas com sucesso</div>}
            {geoStatus === "erro" && <div style={{ fontSize: 11, color: "var(--danger)",     marginTop: 5 }}>✗ Endereço não encontrado — tente ser mais específico</div>}
            {geoStatus === null   && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Digite o endereço e clique em Geocodificar.</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input mono" value={form.lat} readOnly placeholder="— preenchido automaticamente —"
                style={{ color: form.lat ? "var(--accent2)" : "var(--text-muted)", cursor: "default", opacity: 0.8 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input mono" value={form.lng} readOnly placeholder="— preenchido automaticamente —"
                style={{ color: form.lng ? "var(--accent2)" : "var(--text-muted)", cursor: "default", opacity: 0.8 }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição / Observações</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Detalhes sobre o risco..." />
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
            💾 Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
