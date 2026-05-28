import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Scanline, Logo, GlobalFooter, IconArrowRight, IconArrowLeft, IconLoader } from './shared';
import { formatCNPJ } from './shared';
import { loginPonto } from '../../services/pontoColetaApi';

export default function PontoColetaLogin({ onLogin, onBack }) {
  const containerRef = useRef(null);
  const cardRef      = useRef(null);
  const submitRef    = useRef(null);

  const [cnpj,    setCnpj]    = useState('');
  const [senha,   setSenha]   = useState('');
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const cnpjDigits = cnpj.replace(/\D/g, '');
  const canSubmit  = cnpjDigits.length === 14 && senha.length >= 4;

  useGSAP(() => {
    gsap.set('.pc-lg-row', { y: 16, opacity: 0 });
    gsap.set(cardRef.current, { scale: 0.97, opacity: 0 });
    const tl = gsap.timeline({ delay: 0.5 });
    tl.to(cardRef.current,  { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to('.pc-lg-row', { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.065 }, '-=0.2');
  }, { scope: containerRef });

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSubmit || loading) return;
    if (submitRef.current) {
      gsap.timeline()
        .to(submitRef.current, { scale: 0.96, duration: 0.08 })
        .to(submitRef.current, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
    }
    setLoading(true);
    setError(null);
    try {
      await loginPonto(cnpj, senha);
      onLogin();
    } catch (err) {
      const msg = err.message || '';
      setError(msg.includes('desativada') || msg.includes('validação')
        ? 'Conta aguardando validação da Defesa Civil.'
        : 'CNPJ ou senha inválidos.');
      if (cardRef.current) {
        gsap.timeline()
          .to(cardRef.current, { x: -8, duration: 0.06 })
          .to(cardRef.current, { x: 8, duration: 0.06 })
          .to(cardRef.current, { x: -5, duration: 0.05 })
          .to(cardRef.current, { x: 5, duration: 0.05 })
          .to(cardRef.current, { x: 0, duration: 0.05 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pc-page pc-page-center" ref={containerRef}>
      <Scanline />
      <div style={{ marginBottom: 18, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--t2)', opacity: 0.18 }}>
        23°01&apos;S &nbsp; 45°33&apos;W &nbsp;—&nbsp; TAUBATÉ · SP
      </div>

      <form ref={cardRef} onSubmit={handleSubmit} className="pc-frame-corners" style={{
        width: '100%', maxWidth: 460,
        background: 'var(--surf-1)', border: '1px solid var(--bd)',
        borderRadius: 'var(--radius-lg)', padding: '36px 32px 28px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
      }}>
        <div className="pc-lg-row"><Logo size="md" /></div>

        <div className="pc-lg-row" style={{ marginTop: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>
            Acessar meu ponto
          </h2>
          <div style={{ color: 'var(--t2)', fontSize: 13, marginTop: 6 }}>
            Informe o CNPJ e a senha do ponto de coleta.
          </div>
        </div>

        <div className="pc-lg-row pc-field" style={{ marginTop: 24 }}>
          <label className="pc-field-label" htmlFor="cnpj-input">CNPJ do ponto</label>
          <input
            id="cnpj-input"
            className="pc-field-input"
            type="text"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={e => { setCnpj(formatCNPJ(e.target.value)); setError(null); }}
            autoComplete="off"
            maxLength={18}
          />
        </div>

        <div className="pc-lg-row pc-field" style={{ marginTop: 16 }}>
          <label className="pc-field-label" htmlFor="senha-input">Senha</label>
          <input
            id="senha-input"
            className="pc-field-input"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={e => { setSenha(e.target.value); setError(null); }}
            autoComplete="current-password"
          />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '0.08em', marginTop: 4 }}>
            Senha padrão: <span style={{ color: 'var(--t2)' }}>password</span> (altere após primeiro acesso)
          </div>
        </div>

        {error && (
          <div className="pc-lg-row pc-err-box" style={{ marginTop: 16 }}>
            <span>{error}</span>
          </div>
        )}

        <div className="pc-lg-row" style={{ display: 'flex', gap: 10, marginTop: 26 }}>
          <button type="button" className="pc-btn pc-btn-ghost" onClick={onBack}>
            <IconArrowLeft size={14} /> Voltar
          </button>
          <button ref={submitRef} type="submit" className="pc-btn pc-btn-primary"
            disabled={!canSubmit || loading} style={{ flex: 1 }}>
            {loading ? <IconLoader /> : <IconArrowRight size={14} />}
            {loading ? 'Verificando…' : 'Acessar'}
          </button>
        </div>

      </form>

      <GlobalFooter />
    </div>
  );
}
