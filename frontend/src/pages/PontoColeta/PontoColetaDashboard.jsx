import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Scanline, Logo, GlobalFooter, IconCheck, IconEdit, IconLogout, IconList, IconArrowRight, IconPlus, IconArchive, CATEGORIA_COR, CATEGORIA_CONFIG } from './shared';
import { getMinhasDemandas, atualizarEstoque, getNome } from '../../services/pontoColetaApi';

export default function PontoColetaDashboard({ onLogout, onVerDoacoes, onCadastrarDemandas, onVerEstoque }) {
  const containerRef = useRef(null);
  const headerRef    = useRef(null);
  const titleRef     = useRef(null);
  const labelRef     = useRef(null);

  const numberRefs = useRef([]);
  const barRefs    = useRef([]);
  const cardRefs   = useRef([]);

  const [demandas,   setDemandas]   = useState([]);
  const [editingId,  setEditingId]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const nome = getNome();

  useEffect(() => {
    getMinhasDemandas()
      .then(setDemandas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useGSAP(() => {
    if (loading || !headerRef.current) return;
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
    gsap.to(cardRefs.current[i], { y: -4, boxShadow: '0 0 0 1px rgba(232,41,76,0.25), 0 12px 28px rgba(0,0,0,0.45)', duration: 0.22 });
    const num = numberRefs.current[i];
    if (num) gsap.to(num, { scale: 1.04, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' });
  };
  const onHoverLeave = i => {
    gsap.to(cardRefs.current[i], { y: 0, boxShadow: 'none', duration: 0.22 });
  };

  const handleSaveEstoque = async (demandaId, novaQtd) => {
    try {
      const updated = await atualizarEstoque(demandaId, parseInt(novaQtd) || 0);
      setDemandas(prev => prev.map(d => d.id === demandaId ? updated : d));
    } catch {}
    setEditingId(null);
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
          <button className="pc-app-header-link" onClick={onLogout}>
            <IconLogout size={12} /> Sair
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 32px' }}>
        <div ref={titleRef} style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, letterSpacing: '-0.025em', color: 'var(--t1)', lineHeight: 1.1 }}>
            {nome || 'Painel do Ponto'}
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)', marginTop: 10, letterSpacing: '0.04em' }}>
            Gestão de demandas e doações recebidas
          </div>
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
                  editing={editingId === d.id}
                  onEdit={() => setEditingId(d.id)}
                  onSave={v => handleSaveEstoque(d.id, v)}
                  onCancel={() => setEditingId(null)}
                />
              );
            })}
          </div>
        )}

        <div className="pc-db-foot" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button type="button"
            style={{
              width: '100%', background: 'transparent',
              border: '1px solid rgba(232,41,76,0.3)', borderRadius: 'var(--radius)',
              color: 'var(--brand)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
              padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s',
            }}
            onClick={onCadastrarDemandas}
            onMouseEnter={e => gsap.to(e.currentTarget, { boxShadow: '0 0 0 1px rgba(232,41,76,0.5), 0 0 24px rgba(232,41,76,0.12)', borderColor: 'rgba(232,41,76,0.6)', duration: 0.2 })}
            onMouseLeave={e => gsap.to(e.currentTarget, { boxShadow: 'none', borderColor: 'rgba(232,41,76,0.3)', duration: 0.2 })}>
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
      </div>

      <GlobalFooter />
    </div>
  );
}

function DemandaCard({ demanda, cor, pct, cardRef, numberRef, barRef, onEnter, onLeave, editing, onEdit, onSave, onCancel }) {
  const unit = CATEGORIA_CONFIG[demanda.categoria]?.unit || 'un';
  const [val, setVal] = useState('0');
  const overlayRef  = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => { setVal('0'); }, [demanda.id, editing]);
  useEffect(() => {
    if (editing && overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2 });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing]);

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

      <div className="pc-stock-card-foot">
        <button className="pc-stock-edit-btn" onClick={onEdit}>
          <IconEdit size={11} /> Atualizar recebido
        </button>
        {demanda.prioridade != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)' }}>Prioridade {demanda.prioridade}</span>
        )}
      </div>

      {editing && (
        <div ref={overlayRef} className="pc-stock-edit-overlay">
          <div className="pc-stock-label">Adicionar quantidade recebida</div>
          <div className="pc-field-wrap">
            <input ref={inputRef} className="pc-field-input" type="text" inputMode="numeric"
              value={val} onChange={e => setVal(e.target.value.replace(/\D/g, ''))}
              style={{ color: cor, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, padding: '8px 12px' }} />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)', pointerEvents: 'none' }}>
              {unit}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '0.06em' }}>
            Recebido atual: {demanda.quantidadeRecebida.toLocaleString('pt-BR')} {unit}
          </div>
          <div className="pc-stock-edit-actions">
            <button className="pc-btn pc-btn-ghost" onClick={onCancel} style={{ flex: 1, padding: '9px 14px', fontSize: 12 }}>Cancelar</button>
            <button className="pc-btn pc-btn-primary" onClick={() => onSave(val)} style={{ flex: 1, padding: '9px 14px', fontSize: 12 }}>
              <IconCheck size={12} /> Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
