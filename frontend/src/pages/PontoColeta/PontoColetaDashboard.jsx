import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Scanline, Logo, GlobalFooter,
  IconList, IconArrowRight, IconPlus, IconArchive,
  IconSettings, IconBell, FixedExitButton,
  CATEGORIA_COR, CATEGORIA_CONFIG,
} from './shared';
import {
  getMinhasDemandas, getNome, getMinhasDoacoes, atualizarPerfil, getMeuPerfil,
} from '../../services/pontoColetaApi';

// ── Settings drawer ───────────────────────────────────────────────────────────
function ConfigDrawer({ onClose }) {
  const [form,    setForm]    = useState({ nomeLocal: '', tipoPonto: null, email: '', senhaAtual: '', novaSenha: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getMeuPerfil().then(p => {
      setForm(f => ({
        ...f,
        nomeLocal: p.name || '',
        tipoPonto: p.type === 'Fixo',
        email:     p.email || '',
      }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false);
    try {
      const dto = {
        nomeLocal:  form.nomeLocal  || undefined,
        tipoPonto:  form.tipoPonto  ?? undefined,
        email:      form.email      || undefined,
        senhaAtual: form.novaSenha ? form.senhaAtual : undefined,
        novaSenha:  form.novaSenha  || undefined,
      };
      await atualizarPerfil(dto);
      setSuccess(true);
      setTimeout(onClose, 800);
    } catch (e) {
      const msg = e.message || '';
      setError(msg.toLowerCase().includes('401') || msg.toLowerCase().includes('unauthorized')
        ? 'Senha atual incorreta.'
        : 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const inp = {
    style: {
      width: '100%', background: 'var(--surf-2)', border: '1px solid var(--bd)',
      borderRadius: 'var(--radius)', color: 'var(--t1)', fontFamily: 'var(--font-mono)',
      fontSize: 13, padding: '10px 12px', outline: 'none',
    },
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: 'var(--surf-1)', borderLeft: '1px solid var(--bd)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.2s ease',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--t1)' }}>Configurações</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)' }}>Editar dados do ponto</div>
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)' }}>
            Carregando…
          </div>
        ) : (
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <section>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Identificação</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Nome do ponto</label>
                  <input {...inp} type="text" value={form.nomeLocal} onChange={e => set('nomeLocal', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Tipo</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ v: true, l: 'Fixo' }, { v: false, l: 'Temporário' }].map(({ v, l }) => (
                      <button key={l} type="button" onClick={() => set('tipoPonto', v)} style={{
                        flex: 1, padding: '10px 0', borderRadius: 'var(--radius)',
                        border: `1px solid ${form.tipoPonto === v ? 'var(--brand)' : 'var(--bd)'}`,
                        background: form.tipoPonto === v ? 'var(--brand-dim)' : 'var(--surf-2)',
                        color: form.tipoPonto === v ? 'var(--brand)' : 'var(--t2)',
                        fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>E-mail</label>
                  <input {...inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Alterar Senha (opcional)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Senha atual</label>
                  <input {...inp} type="password" value={form.senhaAtual} onChange={e => set('senhaAtual', e.target.value)} placeholder="Obrigatória para trocar senha" />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Nova senha</label>
                  <input {...inp} type="password" value={form.novaSenha} onChange={e => set('novaSenha', e.target.value)} placeholder="Deixe em branco para não alterar" />
                </div>
              </div>
            </section>

            {error && (
              <div style={{ background: 'rgba(222,57,63,0.08)', border: '1px solid rgba(222,57,63,0.3)', borderRadius: 'var(--radius)', color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '10px 14px' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)', color: '#22C55E', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '10px 14px' }}>
                ✓ Salvo com sucesso!
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--bd)', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 'var(--radius)', border: '1px solid var(--bd)', background: 'transparent', color: 'var(--t2)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: 11, borderRadius: 'var(--radius)', border: 'none', background: saving ? 'var(--surf-2)' : 'var(--brand)', color: saving ? 'var(--t3)' : '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Notification dropdown ─────────────────────────────────────────────────────
function NotifDropdown({ alerts, pendingCount, onClose }) {
  const hasItems = pendingCount > 0 || alerts.length > 0;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
      <div style={{
        position: 'fixed', top: 58, right: 16, width: 300,
        background: 'var(--surf-1)', border: '1px solid var(--bd)',
        borderRadius: 'var(--radius-lg)', zIndex: 31,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bd)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Notificações
        </div>
        {!hasItems ? (
          <div style={{ padding: '20px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>
            Sem notificações no momento.
          </div>
        ) : (
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {pendingCount > 0 && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--t1)' }}>
                    {pendingCount} doação{pendingCount !== 1 ? 'ões' : ''} pendente{pendingCount !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Aguardando confirmação de recebimento</div>
                </div>
              </div>
            )}
            {alerts.map((a, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.pct >= 100 ? 'var(--brand)' : a.pct >= 90 ? '#F97316' : '#F59E0B', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--t1)' }}>
                    Estoque: {a.label} a {a.pct}%
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>
                    {a.pct >= 100 ? 'Capacidade máxima atingida' : a.pct >= 90 ? 'Quase cheio' : 'Atenção ao nível'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function PontoColetaDashboard({ onLogout, onVerDoacoes, onCadastrarDemandas, onVerEstoque }) {
  const containerRef = useRef(null);
  const headerRef    = useRef(null);
  const titleRef     = useRef(null);
  const labelRef     = useRef(null);

  const numberRefs = useRef([]);
  const barRefs    = useRef([]);
  const cardRefs   = useRef([]);

  const [demandas,      setDemandas]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showConfig,    setShowConfig]    = useState(false);
  const [showNotif,     setShowNotif]     = useState(false);
  const [pendingCount,  setPendingCount]  = useState(0);
  const nome = getNome();
  const hasAnimated = useRef(false);

  function fetchData() {
    getMinhasDemandas().then(setDemandas).catch(() => {});
    getMinhasDoacoes()
      .then(doas => setPendingCount(doas.filter(d => d.status === 'pendente').length))
      .catch(() => {});
  }

  useEffect(() => {
    getMinhasDemandas()
      .then(setDemandas)
      .catch(() => {})
      .finally(() => setLoading(false));
    getMinhasDoacoes()
      .then(doas => setPendingCount(doas.filter(d => d.status === 'pendente').length))
      .catch(() => {});
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, []);

  // Stock alerts at 80 / 90 / 100 %
  const stockAlerts = demandas.reduce((acc, d) => {
    if (!d.quantidadeDemanda) return acc;
    const pct = Math.round((d.quantidadeRecebida / d.quantidadeDemanda) * 100);
    if (pct >= 80) acc.push({ label: CATEGORIA_CONFIG[d.categoria]?.label || d.categoria, pct });
    return acc;
  }, []);

  const notifTotal = pendingCount + stockAlerts.length;

  useGSAP(() => {
    if (loading || !headerRef.current) return;

    if (hasAnimated.current) {
      // Polling update: atualizar números e barras sem re-animar entrada
      demandas.forEach((d, i) => {
        const el = numberRefs.current[i];
        if (el) el.textContent = d.quantidadeRecebida.toLocaleString('pt-BR');
        const pct = d.quantidadeDemanda > 0 ? d.quantidadeRecebida / d.quantidadeDemanda : 0;
        if (barRefs.current[i]) {
          gsap.to(barRefs.current[i], { scaleX: Math.min(pct, 1), duration: 0.6, ease: 'power2.out' });
        }
      });
      return;
    }
    hasAnimated.current = true;

    gsap.set(headerRef.current, { y: -20, opacity: 0 });
    gsap.set(titleRef.current,  { opacity: 0 });
    gsap.set(labelRef.current,  { opacity: 0 });
    gsap.set('.pc-db-card',     { scale: 0.92, opacity: 0 });
    gsap.set('.pc-db-foot',     { opacity: 0, y: 8 });

    const tl = gsap.timeline({ delay: 0.3 });
    tl.to(headerRef.current, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to(titleRef.current,  { opacity: 1, duration: 0.3 }, '-=0.15')
      .to(labelRef.current,  { opacity: 1, duration: 0.3 }, '-=0.2')
      .to('.pc-db-card',     { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.09 }, '-=0.1')
      .add(() => {
        demandas.forEach((d, i) => {
          const el = numberRefs.current[i];
          if (!el) return;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: d.quantidadeRecebida, duration: 1.2, ease: 'power3.out',
            onUpdate() { el.textContent = Math.round(obj.val).toLocaleString('pt-BR'); },
          });
          const pct = d.quantidadeDemanda > 0 ? d.quantidadeRecebida / d.quantidadeDemanda : 0;
          if (barRefs.current[i]) {
            gsap.fromTo(barRefs.current[i], { scaleX: 0 }, { scaleX: Math.min(pct, 1), duration: 1.1, ease: 'power3.out', delay: 0.1 });
          }
        });
      })
      .to('.pc-db-foot', { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, '+=0.3');
  }, { scope: containerRef, dependencies: [loading, demandas] });

  const onHoverEnter = i => {
    gsap.to(cardRefs.current[i], { y: -4, boxShadow: '0 0 0 1px rgba(222,57,63,0.25), 0 12px 28px rgba(0,0,0,0.45)', duration: 0.22 });
    const num = numberRefs.current[i];
    if (num) gsap.to(num, { scale: 1.04, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' });
  };
  const onHoverLeave = i => {
    gsap.to(cardRefs.current[i], { y: 0, boxShadow: 'none', duration: 0.22 });
  };

  return (
    <div className="pc-page" ref={containerRef}>
      <Scanline />

      <header ref={headerRef} className="pc-app-header">
        <div className="pc-app-header-left"><Logo size="sm" /></div>
        <div className="pc-app-header-right">
          <div className="pc-status-badge" style={{ fontSize: 9 }}>
            <span className="pc-status-dot active" /> Validado
          </div>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              className="pc-app-header-link"
              onClick={() => setShowNotif(v => !v)}
              style={{ position: 'relative' }}
            >
              <IconBell size={14} />
              {notifTotal > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  minWidth: 14, height: 14, borderRadius: 99,
                  background: 'var(--brand)', color: '#fff',
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {notifTotal}
                </span>
              )}
            </button>
            {showNotif && (
              <NotifDropdown
                alerts={stockAlerts}
                pendingCount={pendingCount}
                onClose={() => setShowNotif(false)}
              />
            )}
          </div>
          {/* Settings */}
          <button className="pc-app-header-link" onClick={() => setShowConfig(true)}>
            <IconSettings size={14} />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>
        <div ref={titleRef} style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, letterSpacing: '-0.025em', color: 'var(--t1)', lineHeight: 1.1 }}>
            {nome || 'Painel do Ponto'}
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)', marginTop: 10, letterSpacing: '0.04em' }}>
            Gestão de demandas e doações recebidas
          </div>
        </div>

        {/* ── Action buttons moved to top (1.2) ── */}
        <div className="pc-db-foot" style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button type="button"
            style={{
              width: '100%', background: 'transparent',
              border: '1px solid rgba(222,57,63,0.3)', borderRadius: 'var(--radius)',
              color: 'var(--brand)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
              padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s',
            }}
            onClick={onCadastrarDemandas}
            onMouseEnter={e => gsap.to(e.currentTarget, { boxShadow: '0 0 0 1px rgba(222,57,63,0.5), 0 0 24px rgba(222,57,63,0.12)', borderColor: 'rgba(222,57,63,0.6)', duration: 0.2 })}
            onMouseLeave={e => gsap.to(e.currentTarget, { boxShadow: 'none', borderColor: 'rgba(222,57,63,0.3)', duration: 0.2 })}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <IconPlus size={14} /> Cadastrar Demandas
            </span>
            <IconArrowRight size={14} />
          </button>
          <button type="button"
            style={{
              width: '100%', background: 'transparent',
              border: '1px solid var(--bd)', borderRadius: 'var(--radius)',
              color: 'var(--t2)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
              padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s',
            }}
            onClick={onVerEstoque}
            onMouseEnter={e => gsap.to(e.currentTarget, { borderColor: 'rgba(139,148,158,0.4)', duration: 0.2 })}
            onMouseLeave={e => gsap.to(e.currentTarget, { borderColor: 'var(--bd)', duration: 0.2 })}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <IconArchive size={14} /> Ver Estoque
            </span>
            <IconArrowRight size={14} />
          </button>
          <button type="button"
            style={{
              width: '100%', background: 'transparent',
              border: '1px solid var(--bd)', borderRadius: 'var(--radius)',
              color: 'var(--t2)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
              padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s',
            }}
            onClick={onVerDoacoes}
            onMouseEnter={e => gsap.to(e.currentTarget, { borderColor: 'rgba(139,148,158,0.4)', duration: 0.2 })}
            onMouseLeave={e => gsap.to(e.currentTarget, { borderColor: 'var(--bd)', duration: 0.2 })}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <IconList size={14} /> Ver todas as doações
            </span>
            <IconArrowRight size={14} />
          </button>
        </div>

        <div ref={labelRef} className="pc-section-label" style={{ marginBottom: 20 }}>
          <span>Demandas / Estoque atual</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)' }}>
            Carregando…
          </div>
        ) : demandas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)', border: '1px dashed var(--bd)', borderRadius: 'var(--radius)' }}>
            Nenhuma demanda cadastrada ainda.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {demandas.map((d, i) => {
              const cor = CATEGORIA_COR[d.categoria] || 'var(--t2)';
              const pct = d.quantidadeDemanda > 0 ? Math.round((d.quantidadeRecebida / d.quantidadeDemanda) * 100) : 0;
              return (
                <DemandaCard key={d.id}
                  demanda={d} cor={cor} pct={pct}
                  cardRef={el => cardRefs.current[i] = el}
                  numberRef={el => numberRefs.current[i] = el}
                  barRef={el => barRefs.current[i] = el}
                  onEnter={() => onHoverEnter(i)}
                  onLeave={() => onHoverLeave(i)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Sair button — bottom-right (1.3, 1.4) */}
      <FixedExitButton onClick={onLogout} />

      {showConfig && <ConfigDrawer onClose={() => setShowConfig(false)} />}

      <GlobalFooter />
    </div>
  );
}

function DemandaCard({ demanda, cor, pct, cardRef, numberRef, barRef, onEnter, onLeave }) {
  const unit = CATEGORIA_CONFIG[demanda.categoria]?.unit || 'un';

  return (
    <div ref={cardRef} className="pc-stock-card pc-db-card" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="pc-stock-label">{CATEGORIA_CONFIG[demanda.categoria]?.label || demanda.categoria}</div>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cor, boxShadow: `0 0 0 3px ${cor}22` }} />
      </div>

      <div className="pc-stock-num-wrap">
        <span ref={numberRef} className="pc-stock-num" style={{ color: cor }}>0</span>
        <span className="pc-stock-unit">/ {demanda.quantidadeDemanda} {unit}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="pc-stock-bar-track" style={{ flex: 1 }}>
          <div ref={barRef} className="pc-stock-bar-fill" style={{ background: cor, opacity: 0.85 }} />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', minWidth: 28, textAlign: 'right' }}>{pct}%</div>
      </div>

      {demanda.prioridade != null && (
        <div className="pc-stock-card-foot">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)' }}>Prioridade {demanda.prioridade}</span>
        </div>
      )}
    </div>
  );
}
