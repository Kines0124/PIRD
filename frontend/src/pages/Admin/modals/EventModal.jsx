import { useState } from "react";
import { SEVERITY_OPTIONS } from "../adminTheme.jsx";
import { useGeocodingAutocomplete } from "../../../hooks/useGeocodingAutocomplete.js";

const TIPO_OPTIONS = [
  { value: "enchente",     label: "🌊 Enchente" },
  { value: "deslizamento", label: "⛰️ Deslizamento" },
  { value: "alagamento",   label: "💧 Alagamento" },
  { value: "incendio",     label: "🔥 Incêndio" },
  { value: "desabamento",  label: "🏚️ Desabamento" },
  { value: "intoxicacao",  label: "☣️ Intoxicação" },
  { value: "outro",        label: "⚠️ Outro" },
];

const PROFISSOES_NECESSARIAS = [
  "Médico Clínico Geral", "Médico Emergencista", "Médico Cardiologista",
  "Médico Neurologista", "Médico Ortopedista", "Médico Intensivista (UTI)",
  "Enfermeiro(a)", "Técnico de Enfermagem",
  "Psicólogo", "Assistente Social",
  "Engenheiro de Segurança", "Engenheiro Civil",
  "Técnico em Resgate", "Técnico Defesa Civil",
  "Guia de Cão de Resgate", "Mergulhador de Resgate",
];

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
    victims: 0,
    photos: [],
    criticalPointId: null,
    nearbyCollectionIds: [],
    volunteerIds: [],
    ...event,
    neededProfiles: event?.neededProfiles ?? [],
  });

  const [addrQuery, setAddrQuery] = useState(event?.address || "");
  const [showSugs,  setShowSugs]  = useState(false);

  const { sugestoes, carregando } = useGeocodingAutocomplete(addrQuery);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function toggleProfile(prof) {
    set("neededProfiles",
      form.neededProfiles.includes(prof)
        ? form.neededProfiles.filter(p => p !== prof)
        : [...form.neededProfiles, prof]
    );
  }

  function selectSugestao(sug) {
    setAddrQuery(sug.placeName);
    setForm(f => ({
      ...f,
      address: sug.placeName,
      city: sug.cidade || f.city,
      lat: sug.coordenadas.lat.toFixed(6),
      lng: sug.coordenadas.lng.toFixed(6),
    }));
    setShowSugs(false);
  }

  const canSave = form.title.trim() && form.lat && form.lng;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
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
                {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                    padding: "8px 0", borderRadius: 8, textAlign: "center",
                    border: `2px solid ${form.severity === opt.value ? opt.color : "var(--border)"}`,
                    background: form.severity === opt.value ? opt.bg : "var(--bg-elevated)",
                    color: form.severity === opt.value ? opt.color : "var(--text-muted)",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s", userSelect: "none",
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
                onFocus={() => sugestoes.length > 0 && setShowSugs(true)}
                onBlur={() => setTimeout(() => setShowSugs(false), 150)}
                placeholder="Ex: Av. Charles Schneider, Taubaté"
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
            <label className="form-label">Vítimas Estimadas</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={form.victims ?? ""}
              onChange={e => set("victims", e.target.value === "" ? null : parseInt(e.target.value) || 0)}
              placeholder="— (deixe em branco se desconhecido)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Profissionais necessários</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, background: "var(--bg-elevated)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}>
              {PROFISSOES_NECESSARIAS.map(prof => {
                const checked = form.neededProfiles.includes(prof);
                return (
                  <label key={prof} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, cursor: "pointer", color: checked ? "var(--accent)" : "var(--text-secondary)", fontWeight: checked ? 600 : 400 }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleProfile(prof)}
                      style={{ accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 }} />
                    {prof}
                  </label>
                );
              })}
            </div>
            {form.neededProfiles.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 5 }}>
                {form.neededProfiles.length} profissional(is) selecionado(s)
              </div>
            )}
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
            onClick={() => { onSave({ ...form, victims: form.victims ?? 0 }); onClose(); }}
          >
            💾 Salvar Evento
          </button>
        </div>
      </div>
    </div>
  );
}
