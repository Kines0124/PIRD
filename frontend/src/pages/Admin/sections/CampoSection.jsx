import MapaCampo from "../components/MapaCampo";

const PROF_COLORS = {
  "Médico": "#2563eb", "Médico Clínico Geral": "#2563eb", "Médico Emergencista": "#2563eb",
  "Enfermeiro(a)": "#16a34a", "Bombeiro Civil": "#dc2626", "Bombeiro Militar": "#dc2626",
  "Paramédico / SAMU": "#7c3aed", "Psicólogo": "#0891b2",
  "Engenheiro de Segurança": "#d97706", "Técnico em Resgate": "#71717a",
};

const STATUS_MAP = {
  disponivel: { label: "Disponível", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  a_caminho:  { label: "A caminho",  color: "#ca8a04", bg: "rgba(202,138,4,0.1)" },
  no_local:   { label: "No local",   color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s atrás`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min atrás`;
  return `${Math.floor(m / 60)}h atrás`;
}

function ProfCard({ prof }) {
  const color = PROF_COLORS[prof.especialidade] || "#71717a";
  const st    = STATUS_MAP.disponivel;

  return (
    <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
        {prof.nome.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 2 }}>{prof.nome}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>{prof.especialidade}</div>
        <span style={{ backgroundColor: st.bg, color: st.color, borderRadius: 99, fontSize: 10, fontWeight: 600, padding: "2px 8px" }}>{st.label}</span>
      </div>
    </div>
  );
}

export default function CampoSection({ events, volunteers }) {
  const ativos = events.filter(e => e.status === "ativo");
  const aprovados = volunteers.filter(v => v.status === "aprovado" && v.latitude != null);

  const profissionais = aprovados.map(v => ({
    id: v.id,
    nome: v.nome || v.name,
    profissao: v.especialidade || v.specialty,
    coordenadas: { lat: v.latitude, lng: v.longitude },
    alertaAtendendo: null,
    ultimaAtualizacao: v.registered || new Date().toISOString(),
    statusCampo: "disponivel",
  }));

  const alertas = ativos.map(e => ({
    id: String(e.id),
    titulo: e.title,
    endereco: e.address || e.city || "",
    tipo: e.type,
    criticidade: e.severity === "critico" ? "critico" : e.severity === "alto" ? "grave" : "moderado",
    profissionaisNecessarios: e.neededProfiles || [],
    coordenadas: e.lat ? { lat: e.lat, lng: e.lng } : null,
    criadoEm: e.date || new Date().toISOString(),
    status: "ativo",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Summary */}
      <div style={{ padding: "12px 24px", backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", display: "flex", gap: 20 }}>
        {[
          { label: "Voluntários aprovados", value: aprovados.length, icon: "👥" },
          { label: "Eventos ativos",        value: ativos.length,    icon: "🚨" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div>
              <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>{s.value}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 6 }}>{s.label}</span>
            </div>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>
          Localização de cadastro — estática
        </div>
      </div>

      {/* Map + list */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, padding: 16, display: "flex", overflow: "hidden" }}>
          <MapaCampo alertas={alertas} profissionais={profissionais} />
        </div>

        <div style={{ width: 300, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Voluntários Aprovados</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {profissionais.length === 0
              ? <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13, padding: "30px 0" }}>Nenhum voluntário com localização</div>
              : profissionais.map(p => <ProfCard key={p.id} prof={{ nome: p.nome, especialidade: p.profissao }} />)
            }
          </div>

          {/* Legend */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Legenda</div>
            {[
              { color: "#FF4444", label: "Evento Crítico" },
              { color: "#FF6B00", label: "Evento Grave" },
              { color: "#F5A623", label: "Evento Moderado" },
            ].map(i => (
              <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: i.color }} />
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{i.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
