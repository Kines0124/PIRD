import { useState, useMemo } from "react";
import RegistroDrawer from "../components/RegistroDrawer";

const CONSELHOS = [
  { nome: "CFM — Médicos",             url: "https://portal.cfm.org.br/busca-medicos" },
  { nome: "COFEN — Enfermeiros",        url: "https://cofen.gov.br/consulta-enfermeiro" },
  { nome: "CFP — Psicólogos",           url: "https://cadastro.cfp.org.br" },
  { nome: "CONFEA/CREA — Engenheiros",  url: "https://www.confea.org.br" },
];

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function StatusBadge({ status }) {
  const map = {
    pendente:  { color: "#ca8a04", bg: "rgba(202,138,4,0.1)",  label: "⏳ Pendente" },
    aprovado:  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",  label: "✓ Aprovado" },
    reprovado: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",  label: "✗ Reprovado" },
  };
  const s = map[status] || map.pendente;
  return <span style={{ backgroundColor: s.bg, color: s.color, borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "3px 10px" }}>{s.label}</span>;
}

function RegistroCard({ reg, onRevisar, onDeletar }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDeletar();
    setDeleting(false);
    setConfirming(false);
  }

  return (
    <div style={{ backgroundColor: "var(--bg-elevated)", border: `1px solid ${confirming ? "#dc262655" : "var(--border)"}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.2s" }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
        {reg.nome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>{reg.nome}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{reg.profissao} · {reg.numeroRegistro}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>Cadastro: {fmt(reg.criadoEm)}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <StatusBadge status={reg.status} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {reg.status === "pendente" && !confirming && (
            <button onClick={onRevisar} style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 12, padding: "5px 12px", cursor: "pointer", fontWeight: 500 }}>
              Revisar →
            </button>
          )}
          {!confirming ? (
            <button onClick={() => setConfirming(true)} title="Excluir cadastro"
              style={{ background: "none", border: "1px solid transparent", borderRadius: 7, color: "var(--text-muted)", fontSize: 15, padding: "4px 8px", cursor: "pointer", lineHeight: 1 }}
              onMouseEnter={e => { e.target.style.color = "#dc2626"; e.target.style.background = "rgba(220,38,38,0.07)"; }}
              onMouseLeave={e => { e.target.style.color = "var(--text-muted)"; e.target.style.background = "none"; }}>
              🗑
            </button>
          ) : (
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>Excluir?</span>
              <button onClick={handleDelete} disabled={deleting} style={{ backgroundColor: "#dc2626", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}>
                {deleting ? "..." : "Sim"}
              </button>
              <button onClick={() => setConfirming(false)} style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>
                Não
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ValidacoesSection({ specialists, onAprovar, onReprovar, onDeletar }) {
  const [tab,       setTab]       = useState("pendentes");
  const [drawerReg, setDrawerReg] = useState(null);
  const [histFilter, setHistFilter] = useState({ data: "", profissao: "", tipo: "todos" });

  const pendentes  = specialists.filter(s => s.status === "pendente");
  const aprovados  = specialists.filter(s => s.status === "aprovado");
  const reprovados = specialists.filter(s => s.status === "reprovado");

  const today = new Date(); today.setHours(0,0,0,0);
  const aprovadosHoje  = aprovados.filter(s => s.revisadoEm && new Date(s.revisadoEm) >= today).length;
  const reprovadosHoje = reprovados.filter(s => s.revisadoEm && new Date(s.revisadoEm) >= today).length;

  const historico = useMemo(() => {
    let list = [...aprovados, ...reprovados].sort((a, b) =>
      new Date(b.revisadoEm || b.criadoEm) - new Date(a.revisadoEm || a.criadoEm));
    if (histFilter.tipo !== "todos") list = list.filter(r => r.status === histFilter.tipo);
    if (histFilter.profissao)        list = list.filter(r => r.profissao.toLowerCase().includes(histFilter.profissao.toLowerCase()));
    if (histFilter.data)             list = list.filter(r => {
      const d = new Date(r.revisadoEm || r.criadoEm).toISOString().slice(0, 10);
      return d === histFilter.data;
    });
    return list;
  }, [aprovados, reprovados, histFilter]);

  return (
    <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Validações de Cadastro</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Revisão manual de especialistas cadastrados</div>
      </div>

      {/* Counters */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Pendentes",       value: pendentes.length,  color: "#ca8a04", bg: "rgba(202,138,4,0.1)" },
          { label: "Aprovados hoje",  value: aprovadosHoje,     color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
          { label: "Reprovados hoje", value: reprovadosHoje,    color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${s.color}33` }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Warning */}
      <div style={{ backgroundColor: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#60a5fa", marginBottom: 6 }}>ℹ️ Verificação Obrigatória — Conselhos Profissionais</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
          Antes de aprovar qualquer cadastro, verifique o número de registro no site oficial do conselho correspondente.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {CONSELHOS.map(c => (
            <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600, backgroundColor: "rgba(37,99,235,0.1)", padding: "3px 10px", borderRadius: 99, textDecoration: "none" }}>
              🔗 {c.nome}
            </a>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border)" }}>
        {[["pendentes", `Pendentes (${pendentes.length})`], ["historico", "Histórico"]].map(([t, lbl]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", border: "none", cursor: "pointer", backgroundColor: "transparent", fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? "var(--text-primary)" : "var(--text-secondary)", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent", marginBottom: -1 }}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === "pendentes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pendentes.length === 0
            ? <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 14, padding: "40px 0" }}>✅ Nenhum cadastro pendente</div>
            : pendentes.map(reg => (
              <RegistroCard key={reg.id} reg={reg}
                onRevisar={() => setDrawerReg(reg)}
                onDeletar={() => onDeletar(reg.id)} />
            ))
          }
        </div>
      )}

      {tab === "historico" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select value={histFilter.tipo} onChange={e => setHistFilter(f => ({ ...f, tipo: e.target.value }))}
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "7px 10px" }}>
              <option value="todos">Todos</option>
              <option value="aprovado">Aprovados</option>
              <option value="reprovado">Reprovados</option>
            </select>
            <input type="text" placeholder="Filtrar por profissão..." value={histFilter.profissao}
              onChange={e => setHistFilter(f => ({ ...f, profissao: e.target.value }))}
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "7px 10px", flex: 1, minWidth: 160 }} />
            <input type="date" value={histFilter.data} onChange={e => setHistFilter(f => ({ ...f, data: e.target.value }))}
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, padding: "7px 10px" }} />
          </div>
          {historico.length === 0
            ? <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 14, padding: "30px 0" }}>Nenhum registro no histórico</div>
            : historico.map(reg => <RegistroCard key={reg.id} reg={reg} onRevisar={() => {}} onDeletar={() => onDeletar(reg.id)} />)
          }
        </div>
      )}

      <RegistroDrawer
        registro={drawerReg}
        onClose={() => setDrawerReg(null)}
        onAprovar={id => { onAprovar(id); setDrawerReg(null); }}
        onReprovar={(id, obs) => { onReprovar(id, obs); setDrawerReg(null); }}
      />
    </div>
  );
}
