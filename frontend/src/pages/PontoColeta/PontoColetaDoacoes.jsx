import { useRef, useState, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Scanline, Logo, GlobalFooter, CATEGORIA_COR, IconCheck, FixedBackButton, FixedExitButton } from './shared';
import { getMinhasDoacoes, marcarRecebida, getNome } from '../../services/pontoColetaApi';

function DcTab({ active, label, count, onClick }) {
  return (
    <button className={'pc-dc-tab' + (active ? ' active' : '')} onClick={onClick}>
      <span>{label}</span>
      <span className="pc-dc-tab-count">{count}</span>
    </button>
  );
}

function StatusBadge({ status }) {
  const isRecebida = status === 'recebida';
  const color = isRecebida ? '#22C55E' : '#F59E0B';
  const bg    = isRecebida ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
      color, background: bg, padding: '3px 8px', borderRadius: 4, border: `1px solid ${color}33`, flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {isRecebida ? 'Recebida' : 'Pendente'}
    </span>
  );
}

function Toast({ msg, tipo, onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const tl = gsap.timeline();
    tl.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' })
      .to(el, { y: 10, opacity: 0, duration: 0.3, ease: 'power2.in' }, '+=2.5')
      .add(() => onDone());
    return () => tl.kill();
  }, []);
  return <div ref={ref} className={`pc-toast ${tipo}`}>{msg}</div>;
}

function DoacaoCard({ doacao, setRef, onRecebida }) {
  const localRef = useRef(null);
  const cor = CATEGORIA_COR[doacao.categoriaItem?.toLowerCase()] || 'var(--t2)';
  const isPending = doacao.status === 'pendente';

  useEffect(() => {
    setRef(localRef.current);
    return () => setRef(null);
  }, []);

  const onEnter = () => gsap.to(localRef.current, { y: -2, borderColor: 'var(--bd-hover)', duration: 0.15 });
  const onLeave = () => gsap.to(localRef.current, { y: 0, borderColor: 'var(--bd)', duration: 0.15 });

  return (
    <div ref={localRef} className={'pc-dc-card' + (isPending ? ' pc-frame-corners' : '')}
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      style={{
        background: 'var(--surf-1)', border: '1px solid var(--bd)', borderRadius: 'var(--radius)',
        padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doacao.nomeDoador}
          </span>
        </div>
        <StatusBadge status={doacao.status} />
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t2)', letterSpacing: '0.02em' }}>
        {doacao.contatoDoador}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 8, borderTop: '1px dashed var(--bd)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: cor }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cor, boxShadow: `0 0 0 3px ${cor}22` }} />
            {doacao.categoriaItem || doacao.descricaoItem}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>
            {doacao.quantidade.toLocaleString('pt-BR')}
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, color: 'var(--t2)', marginLeft: 4 }}>un</span>
          </span>
        </div>
        {doacao.criadoEm && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t1)', opacity: 0.4 }}>
            {new Date(doacao.criadoEm).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {isPending && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
          <button onClick={onRecebida} style={{
            width: '100%', background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)',
            color: '#22C55E', fontFamily: 'var(--font-mono)', fontSize: 12,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '9px 12px', cursor: 'pointer', transition: 'background 0.15s',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.12)'}>
            <IconCheck size={12} /> Doação recebida
          </button>
        </div>
      )}
    </div>
  );
}

export default function PontoColetaDoacoes({ onBack, onLogout }) {
  const containerRef = useRef(null);
  const headerRef    = useRef(null);
  const titleRef     = useRef(null);
  const tabsRef      = useRef(null);
  const listRef      = useRef(null);
  const cardRefs     = useRef(new Map());

  const [tab,     setTab]     = useState('pendente');
  const [doacoes, setDoacoes] = useState([]);
  const [toast,   setToast]   = useState(null);
  const [loading, setLoading] = useState(true);
  const nome = getNome();

  useEffect(() => {
    getMinhasDoacoes()
      .then(setDoacoes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts   = useMemo(() => ({
    pendente: doacoes.filter(d => d.status === 'pendente').length,
    recebida: doacoes.filter(d => d.status === 'recebida').length,
  }), [doacoes]);
  const filtered = useMemo(() => doacoes.filter(d => d.status === tab), [doacoes, tab]);

  useGSAP(() => {
    if (loading || !headerRef.current) return;
    gsap.set(headerRef.current, { y: -20, opacity: 0 });
    gsap.set([titleRef.current, tabsRef.current], { y: 12, opacity: 0 });
    gsap.set('.pc-dc-card', { y: 16, opacity: 0 });

    gsap.timeline({ delay: 0.4 })
      .to(headerRef.current,  { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to(titleRef.current,   { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.2')
      .to(tabsRef.current,    { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.25')
      .to('.pc-dc-card',      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.07 }, '-=0.2');
  }, { scope: containerRef, dependencies: [loading] });

  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll('.pc-dc-card');
    gsap.fromTo(cards, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: 'power2.out', stagger: 0.05 });
  }, [tab]);

  const handleRecebida = async (id) => {
    const card = cardRefs.current.get(id);
    if (card) {
      gsap.timeline()
        .to(card, { boxShadow: '0 0 0 1px rgba(34,197,94,0.6), 0 0 24px rgba(34,197,94,0.18)', duration: 0.4, ease: 'power2.out' })
        .to(card, { opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, borderWidth: 0, duration: 0.35, ease: 'power2.in' }, '+=0.1')
        .add(() => {
          cardRefs.current.delete(id);
          setDoacoes(prev => prev.map(d => d.id === id ? { ...d, status: 'recebida' } : d));
          setToast({ msg: '✓ Doação marcada como recebida', tipo: 'success', key: Date.now() });
        });
    }
    try { await marcarRecebida(id); } catch {}
  };

  return (
    <div className="pc-page" ref={containerRef}>
      <Scanline />

      <FixedBackButton onClick={onBack} label="Voltar ao painel" />
      <FixedExitButton onClick={onLogout} />

      <header ref={headerRef} className="pc-app-header">
        <div className="pc-app-header-left"><Logo size="sm" /></div>
        <div className="pc-app-header-right">
          <div className="pc-status-badge" style={{ fontSize: 9 }}>
            <span className="pc-status-dot active" /> Validado
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 32px 80px' }}>
        <div ref={titleRef}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 24, height: 1, background: 'var(--bd)' }} /> Doações
            </div>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.025em', color: 'var(--t1)', lineHeight: 1.1, marginBottom: 4 }}>
            {nome || 'Meu Ponto'}
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', letterSpacing: '0.06em', marginBottom: 28 }}>
            {counts.pendente + counts.recebida} doações registradas
          </div>
        </div>

        <div ref={tabsRef} className="pc-dc-tabs">
          <DcTab active={tab === 'pendente'} label="Pendentes" count={counts.pendente} onClick={() => setTab('pendente')} />
          <DcTab active={tab === 'recebida'} label="Recebidas"  count={counts.recebida}  onClick={() => setTab('recebida')} />
          <div style={{ flex: 1 }} />
        </div>

        <div ref={listRef} className="pc-dc-list">
          {loading ? (
            <div className="pc-dc-empty">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="pc-dc-empty">
              Nenhuma doação {tab === 'pendente' ? 'pendente' : 'recebida'} no momento.
            </div>
          ) : filtered.map(d => (
            <DoacaoCard key={d.id} doacao={d}
              setRef={el => { if (el) cardRefs.current.set(d.id, el); else cardRefs.current.delete(d.id); }}
              onRecebida={() => handleRecebida(d.id)} />
          ))}
        </div>
      </div>

      <GlobalFooter />
      {toast && <Toast key={toast.key} msg={toast.msg} tipo={toast.tipo} onDone={() => setToast(null)} />}
    </div>
  );
}
