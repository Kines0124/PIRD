import { useState } from "react";
import { useGeocodingAutocomplete } from "../../../hooks/useGeocodingAutocomplete.js";

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

  const [addrQuery, setAddrQuery] = useState(point?.address || "");
  const [showSugs,  setShowSugs]  = useState(false);

  const { sugestoes, carregando } = useGeocodingAutocomplete(showSugs ? addrQuery : "");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function selectSugestao(sug) {
    setAddrQuery(sug.shortName);
    setForm(f => ({
      ...f,
      address: sug.shortName,
      city: sug.cidade || f.city,
      lat: sug.coordenadas.lat.toFixed(6),
      lng: sug.coordenadas.lng.toFixed(6),
    }));
    setShowSugs(false);
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
            <label className="form-label">Endereço *</label>
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                value={addrQuery}
                onChange={e => {
                  setAddrQuery(e.target.value);
                  set("address", e.target.value);
                  set("lat", ""); set("lng", "");
                  setShowSugs(true);
                }}
                onFocus={() => setShowSugs(true)}
                onBlur={() => setTimeout(() => setShowSugs(false), 150)}
                placeholder="Ex: Encosta Norte, Taubaté"
              />
              {carregando && (
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>
                  📡…
                </span>
              )}
              {showSugs && sugestoes.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, zIndex: 200, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                  {sugestoes.map((s, i) => (
                    <div
                      key={s.id || i}
                      onMouseDown={() => selectSugestao(s)}
                      style={{ padding: "9px 12px", fontSize: 12.5, cursor: "pointer", color: "var(--text-primary)", borderBottom: i < sugestoes.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}
                    >
                      📍 {s.placeName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {form.lat && form.lng
              ? <div style={{ fontSize: 11, color: "var(--success)", marginTop: 5 }}>✓ Coordenadas obtidas: {form.lat}, {form.lng}{form.city ? ` — ${form.city}` : ""}</div>
              : <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Digite o endereço para ver sugestões com autocomplete.</div>
            }
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input mono" value={form.lat} readOnly placeholder="— autocomplete —"
                style={{ color: form.lat ? "var(--accent2)" : "var(--text-muted)", cursor: "default", opacity: 0.8 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input mono" value={form.lng} readOnly placeholder="— autocomplete —"
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
