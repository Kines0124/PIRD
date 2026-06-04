import { useState, useRef, useEffect } from "react";
import { SEVERITY_OPTIONS } from "../adminTheme.jsx";
import { useGeocodingAutocomplete } from "../../../hooks/useGeocodingAutocomplete.js";
import { MdFlood } from "react-icons/md";
import { LuLandPlot } from "react-icons/lu";
import { LuDroplets } from "react-icons/lu";
import { LuFlame } from "react-icons/lu";
import { LuConstruction } from "react-icons/lu";
import { PiBiohazardThin } from "react-icons/pi";
import { IoWarningOutline } from "react-icons/io5";

const TIPO_OPTIONS = [
  { value: "enchente",     label: "Enchente",     icon: MdFlood,         color: "#3b82f6" }, // azul
  { value: "deslizamento", label: "Deslizamento", icon: LuLandPlot,      color: "#a16207" }, // marrom
  { value: "alagamento",   label: "Alagamento",   icon: LuDroplets,      color: "#06b6d4" }, // ciano
  { value: "incendio",     label: "Incêndio",     icon: LuFlame,         color: "#ef4444" }, // vermelho
  { value: "desabamento",  label: "Desabamento",  icon: LuConstruction,  color: "#f97316" }, // laranja
  { value: "intoxicacao",  label: "Intoxicação",  icon: PiBiohazardThin, color: "#84cc16" }, // verde-limão
  { value: "outro",        label: "Outro",        icon: IoWarningOutline, color: "#eab308" }, // amarelo
];

function TipoSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selected = TIPO_OPTIONS.find(o => o.value === value) || TIPO_OPTIONS[0];
  const SelectedIcon = selected.icon;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="form-select"
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: "100%", textAlign: "left", background: "var(--bg-elevated)" }}
        onClick={() => setOpen(o => !o)}
      >
        <SelectedIcon size={15} style={{ color: selected.color }} />
        <span style={{ color: selected.color }}>{selected.label}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, zIndex: 200, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {TIPO_OPTIONS.map((opt, i) => {
            const OptIcon = opt.icon;
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onMouseDown={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: "9px 12px", fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  color: "var(--text-primary)",
                  background: isSelected ? `${opt.color}18` : "",
                  borderBottom: i < TIPO_OPTIONS.length - 1 ? "1px solid var(--border)" : "none",
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${opt.color}28`}
                onMouseLeave={e => e.currentTarget.style.background = isSelected ? `${opt.color}18` : ""}
              >
                <OptIcon size={15} style={{ color: opt.color }} />
                <span style={{ color: opt.color, fontWeight: isSelected ? 600 : 400 }}>{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


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
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState(null);

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

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaveError(null); };

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

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ ...form, victims: form.victims ?? 0 });
    } catch (e) {
      setSaveError(e.message || "Erro ao salvar evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div className="modal-title">{event ? "Editar Evento" : "Cadastrar Novo Evento"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {form.status === "encerrado" && (
            <div style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 12,
              color: "#dc2626",
              fontWeight: 600,
            }}>
              🔒 Evento encerrado — não é possível realizar alterações.
            </div>
          )}

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
              <TipoSelect value={form.type} onChange={v => set("type", v)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={e => set("status", e.target.value)}
                disabled={form.status === "encerrado"}
                style={form.status === "encerrado" ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
                <option value="ativo">Ativo</option>
                <option value="monitoramento">Monitoramento</option>
                <option value="controlado">Controlado</option>
                {/* Encerrado só aparece na edição de evento já encerrado */}
                {event && <option value="encerrado">Encerrado</option>}
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

        {saveError && (
          <div style={{
            margin: "0 24px 4px",
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 13,
            color: "#dc2626",
            fontWeight: 600,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}>
            <span style={{ flexShrink: 0 }}>⛔</span>
            <span>{saveError}</span>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={!canSave || saving}
            style={{ opacity: (canSave && !saving) ? 1 : 0.4 }}
            onClick={handleSave}
          >
            {saving ? "Salvando…" : "💾 Salvar Evento"}
          </button>
        </div>
      </div>
    </div>
  );
}
