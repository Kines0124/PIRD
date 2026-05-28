import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Scanline, Logo, GlobalFooter, IconX, IconClock, IconBan } from './shared';

export default function PontoColetaAguardando({ registro, onLogout }) {
  const containerRef = useRef(null);
  const cardRef      = useRef(null);
  const ring1Ref     = useRef(null);
  const ring2Ref     = useRef(null);
  const ring3Ref     = useRef(null);
  const iconRef      = useRef(null);
  const liveDotRef   = useRef(null);

  const isRejected = registro?.status === 'rejeitado';
  const color      = isRejected ? '#E8294C' : '#F59E0B';
  const colorRGB   = isRejected ? '232,41,76' : '245,158,11';

  useGSAP(() => {
    gsap.set(cardRef.current,  { scale: 0.97, opacity: 0 });
    gsap.set('.pc-aw-row',     { y: 14, opacity: 0 });
    gsap.set('.pc-aw-data-row',{ x: -10, opacity: 0 });

    const tl = gsap.timeline({ delay: 0.5 });
    tl.to(cardRef.current,   { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to('.pc-aw-row',      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.07 }, '-=0.2')
      .to('.pc-aw-data-row', { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, '-=0.3');

    const rings = [ring1Ref.current, ring2Ref.current, ring3Ref.current];
    const pulseTl = gsap.timeline({ repeat: -1 });
    rings.forEach((ring, i) => {
      pulseTl.fromTo(ring,
        { scale: 1, opacity: 0.55 - i * 0.12 },
        { scale: 3.2, opacity: 0, duration: 2.4, ease: 'power1.out' },
        i * 0.7
      );
    });

    gsap.to(liveDotRef.current, { opacity: 0.3, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }, { scope: containerRef });

  const dataRows = [
    { label: 'Nome',     value: registro?.nomeLocal || '—' },
    { label: 'CNPJ',     value: registro?.cnpj || '—' },
    { label: 'Cidade',   value: registro?.cidade || '—' },
    { label: 'Status',   value: isRejected ? 'Rejeitado' : 'Pendente' },
  ];

  return (
    <div className="pc-page pc-page-center" ref={containerRef}>
      <Scanline />

      <div ref={cardRef} className="pc-frame-corners" style={{
        width: '100%', maxWidth: 520,
        background: 'var(--surf-1)', border: '1px solid var(--bd)',
        borderRadius: 'var(--radius-lg)', padding: '40px 32px 28px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
      }}>
        <div className="pc-aw-row" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)',
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 28,
        }}>
          <Logo size="sm" />
          <span>Status: {isRejected ? 'Rejeitado' : 'Pendente'}</span>
        </div>

        <div className="pc-aw-row" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div className="pc-pulse-wrap" style={{ color }}>
            <div ref={ring1Ref} className="pc-pulse-ring" />
            <div ref={ring2Ref} className="pc-pulse-ring" />
            <div ref={ring3Ref} className="pc-pulse-ring" />
            <div className="pc-pulse-core" style={{
              background: `radial-gradient(circle, rgba(${colorRGB},0.22), rgba(${colorRGB},0.04))`,
              border: `1px solid rgba(${colorRGB},0.4)`,
            }}>
              <span ref={iconRef} style={{ color, display: 'inline-flex' }}>
                {isRejected ? <IconBan size={26} /> : <IconClock size={26} />}
              </span>
            </div>
          </div>
        </div>

        <div className="pc-aw-row" style={{ textAlign: 'center', marginBottom: 8 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.025em', color: 'var(--t1)' }}>
            {isRejected ? 'Cadastro rejeitado' : 'Aguardando análise'}
          </h2>
        </div>
        <div className="pc-aw-row" style={{
          textAlign: 'center', color: 'var(--t2)', fontSize: 14,
          maxWidth: 380, margin: '0 auto 8px', lineHeight: 1.5,
        }}>
          {isRejected
            ? (registro?.observacao || 'Seu cadastro não foi aprovado.')
            : 'Cadastro enviado. Nossa equipe analisará os dados em até 48h.'}
        </div>

        {isRejected && registro?.observacao && (
          <div className="pc-aw-row pc-err-box" style={{ marginTop: 16, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{ marginTop: 2 }}><IconX size={14} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Motivo da rejeição</div>
              <div style={{ color: 'var(--t2)', fontSize: 12 }}>{registro.observacao}</div>
            </div>
          </div>
        )}

        <div className="pc-aw-row" style={{ marginTop: 28 }}>
          <div className="pc-section-label" style={{ marginBottom: 12 }}><span>Dados enviados</span></div>
          <div style={{ background: 'var(--surf-2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius)', padding: '4px 16px' }}>
            {dataRows.map(({ label, value }) => (
              <div key={label} className="pc-data-row pc-aw-data-row">
                <div className="pc-data-row-label">{label}</div>
                <div className="pc-data-row-val">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pc-aw-row" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bd)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--t2)',
          }}>
            <span ref={liveDotRef} style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 0 3px rgba(${colorRGB},0.18)` }} />
            Monitorando em tempo real
          </div>
          {onLogout && (
            <button className="pc-app-header-link" onClick={onLogout}>Sair</button>
          )}
        </div>
      </div>

      <div className="pc-aw-row" style={{ marginTop: 18, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t2)', opacity: 0.18, letterSpacing: '0.08em' }}>
        23°01&apos;S &nbsp; 45°33&apos;W &nbsp;—&nbsp; TAUBATÉ · SP
      </div>

      <GlobalFooter />
    </div>
  );
}
