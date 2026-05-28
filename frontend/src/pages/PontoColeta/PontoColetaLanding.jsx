import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Scanline, Logo, GlobalFooter, IconArrowRight } from './shared';

const STATS = [
  { id: 'alimentos', label: 'Alimentos', value: 847,  unidade: 'kg',  cor: '#F97316' },
  { id: 'agua',      label: 'Água',      value: 312,  unidade: 'L',   cor: '#38BDF8' },
  { id: 'roupas',    label: 'Roupas',    value: 2184, unidade: 'pçs', cor: '#A78BFA' },
];

export default function PontoColetaLanding({ onCadastrar, onAcessar }) {
  const containerRef = useRef(null);
  const badgeRef     = useRef(null);
  const cardRef      = useRef(null);
  const primaryBtnRef = useRef(null);
  const dotRef       = useRef(null);
  const coordRef     = useRef(null);
  const statNumRefs  = useRef([]);

  useGSAP(() => {
    gsap.set(badgeRef.current,  { y: -10, opacity: 0 });
    gsap.set(cardRef.current,   { scale: 0.96, opacity: 0 });
    gsap.set('.pc-lp-row',      { y: 14, opacity: 0 });
    gsap.set(coordRef.current,  { opacity: 0 });

    const tl = gsap.timeline({ delay: 0.55 });
    tl.to(badgeRef.current, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to(cardRef.current,  { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out' }, '-=0.15')
      .to('.pc-lp-row',     { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.065 }, '-=0.2')
      .to(coordRef.current, { opacity: 0.2, duration: 0.5 }, '-=0.2')
      .to(primaryBtnRef.current, { scale: 1.03, duration: 0.18, ease: 'power1.inOut', yoyo: true, repeat: 1 });

    STATS.forEach((stat, i) => {
      const el = statNumRefs.current[i];
      if (!el) return;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: stat.value, duration: 1.4, ease: 'power3.out', delay: 0.55 + 0.8,
        onUpdate() { el.textContent = Math.round(obj.val).toLocaleString('pt-BR'); },
      });
    });

    gsap.to(dotRef.current, { opacity: 0.35, duration: 1.0, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }, { scope: containerRef });

  return (
    <div className="pc-page" ref={containerRef} style={{
      backgroundImage: 'radial-gradient(ellipse 800px 600px at center, rgba(232,41,76,0.05) 0%, transparent 70%)',
    }}>
      <Scanline />

      <div style={{
        position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', gap: 22,
      }}>
        <div ref={badgeRef} className="pc-status-badge" style={{ fontSize: 10 }}>
          <span ref={dotRef} className="pc-status-dot active" />
          SISTEMA ATIVO · TAUBATÉ
        </div>

        <div ref={cardRef} className="pc-frame-corners" style={{
          width: '100%', maxWidth: 560,
          background: 'var(--surf-1)', border: '1px solid var(--bd)',
          borderRadius: 'var(--radius-lg)', padding: '40px 36px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 24px 48px rgba(0,0,0,0.45)',
        }}>
          <div className="pc-lp-row"><Logo size="lg" /></div>

          <div className="pc-lp-row" style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginTop: 28, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span>Comece aqui</span>
            <span style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
          </div>

          <div className="pc-lp-row" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            margin: '0 0 24px', padding: '16px 0',
            borderTop: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)',
          }}>
            {STATS.map((stat, i) => (
              <div key={stat.id} style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '4px 14px', borderRight: '1px solid rgba(255,255,255,0.07)',
                ...(i === STATS.length - 1 ? { borderRight: 'none' } : {}),
                ...(i === 0 ? { paddingLeft: 4 } : {}),
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                  <span ref={el => { statNumRefs.current[i] = el; }} style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
                    color: stat.cor, fontVariantNumeric: 'tabular-nums',
                  }}>0</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t2)', opacity: 0.7 }}>
                    {stat.unidade}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="pc-lp-row" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button ref={primaryBtnRef} className="pc-btn-row-card primary" onClick={onCadastrar}
              onMouseEnter={e => gsap.to(e.currentTarget, { boxShadow: 'var(--glow-brand)', duration: 0.2 })}
              onMouseLeave={e => gsap.to(e.currentTarget, { boxShadow: 'none', duration: 0.2 })}>
              <span>Cadastrar novo ponto</span><IconArrowRight />
            </button>
            <button className="pc-btn-row-card" onClick={onAcessar}>
              <span>Acessar meu ponto</span><IconArrowRight />
            </button>
          </div>

          <div className="pc-lp-row" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid var(--bd)', marginTop: 28, paddingTop: 16,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Versão 1.0 / Beta
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--success)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="pc-status-dot active" style={{ boxShadow: 'none', width: 6, height: 6 }} />
              Online
            </div>
          </div>
        </div>

        <div ref={coordRef} style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
          color: 'var(--t2)', textAlign: 'center', opacity: 0,
        }}>
          23°01&apos;S &nbsp; 45°33&apos;W &nbsp;—&nbsp; TAUBATÉ · SP
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
