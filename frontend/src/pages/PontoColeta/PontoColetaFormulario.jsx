import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Scanline, Logo, GlobalFooter,
  IconCheck, IconX, IconArrowRight, IconArrowLeft, IconLoader,
  formatCNPJ,
} from './shared';
import { registrar } from '../../services/pontoColetaApi';

function maskCEP(v) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
}

export default function PontoColetaFormulario({ onSubmit, onBack }) {
  const containerRef = useRef(null);
  const cardRef      = useRef(null);
  const step1Ref     = useRef(null);
  const step2Ref     = useRef(null);
  const stepFillRef  = useRef(null);
  const submitRef    = useRef(null);

  const [step,       setStep]       = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [cepStatus,  setCepStatus]  = useState(null); // null | 'loading' | 'ok' | 'error'
  const [form, setForm] = useState({
    nomeLocal: '', cnpj: '', telefone: '',
    rua: '', numero: '', bairro: '', cidade: '', cep: '', email: '',
    tipoPonto: true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cnpjDigits = form.cnpj.replace(/\D/g, '');
  const step1Valid = form.nomeLocal.trim().length >= 3 && cnpjDigits.length === 14 && form.telefone.trim().length >= 8;
  const step2Valid = !!(form.rua.trim() && form.numero.trim() && form.bairro.trim() && form.cidade.trim());

  async function lookupCEP(raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepStatus('loading');
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { setCepStatus('error'); return; }
      setForm(f => ({
        ...f,
        rua:    data.logradouro || f.rua,
        bairro: data.bairro     || f.bairro,
        cidade: data.localidade || f.cidade,
      }));
      setCepStatus('ok');
    } catch {
      setCepStatus('error');
    }
  }

  function handleCepChange(v) {
    const masked = maskCEP(v);
    set('cep', masked);
    setCepStatus(null);
    if (masked.replace(/\D/g, '').length === 8) lookupCEP(masked);
  }

  useGSAP(() => {
    gsap.set(cardRef.current,  { scale: 0.97, opacity: 0 });
    gsap.set('.pc-fm-row',     { y: 16, opacity: 0 });
    const tl = gsap.timeline({ delay: 0.5 });
    tl.to(cardRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to('.pc-fm-row', { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.055 }, '-=0.2');
  }, { scope: containerRef });

  const goToStep = (next) => {
    if (next === step) return;
    const fromEl = step === 1 ? step1Ref.current : step2Ref.current;
    const toEl   = next === 1 ? step1Ref.current : step2Ref.current;
    const dir    = next > step ? 1 : -1;

    gsap.timeline({
      onStart: () => gsap.to(stepFillRef.current, { scaleX: next === 2 ? 1 : 0, duration: 0.5, ease: 'power2.inOut' }),
    })
      .to(fromEl, { x: -28 * dir, opacity: 0, duration: 0.22, ease: 'power2.in' })
      .set(fromEl, { display: 'none' })
      .set(toEl,   { display: 'flex', x: 28 * dir, opacity: 0 })
      .to(toEl,    { x: 0, opacity: 1, duration: 0.32, ease: 'power2.out' });

    setStep(next);
  };

  const handleSubmit = async () => {
    if (!step2Valid || submitting) return;
    gsap.timeline()
      .to(submitRef.current, { scale: 0.96, duration: 0.08 })
      .to(submitRef.current, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
    setSubmitting(true);
    setError(null);
    try {
      const result = await registrar({
        nomeLocal: form.nomeLocal,
        cnpj:      form.cnpj,
        telefone:  form.telefone,
        email:     form.email || null,
        rua:       form.rua,
        numero:    form.numero,
        bairro:    form.bairro,
        cidade:    form.cidade,
        cep:       form.cep || null,
        tipoPonto: form.tipoPonto,
      });
      onSubmit(result);
    } catch (err) {
      const msg = err.message || '';
      setError(msg.includes('409') || msg.toLowerCase().includes('cnpj')
        ? 'Este CNPJ já está cadastrado.'
        : 'Erro ao enviar cadastro. Tente novamente.');
      setSubmitting(false);
    }
  };

  const inp = { className: 'pc-field-input' };

  return (
    <div className="pc-page pc-page-center" ref={containerRef}>
      <Scanline />
      <div style={{ marginBottom: 18, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--t2)', opacity: 0.18 }}>
        23°01&apos;S &nbsp; 45°33&apos;W &nbsp;—&nbsp; TAUBATÉ · SP
      </div>

      <div ref={cardRef} className="pc-frame-corners" style={{
        width: '100%', maxWidth: 520,
        background: 'var(--surf-1)', border: '1px solid var(--bd)',
        borderRadius: 'var(--radius-lg)', padding: '32px 32px 28px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
      }}>
        <div className="pc-fm-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size="sm" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Cadastro · Etapa {step}/2
          </div>
        </div>

        <div className="pc-fm-row" style={{ marginTop: 26 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>
            Cadastrar ponto de coleta
          </h2>
          <div style={{ color: 'var(--t2)', fontSize: 13, marginTop: 6 }}>
            Preencha os dados. O cadastro será revisado pela Defesa Civil.
          </div>
        </div>

        <div className="pc-fm-row pc-steps" style={{ marginTop: 28 }}>
          <div className="pc-step-item">
            <div className={'pc-step-dot' + (step >= 1 ? (step > 1 ? ' complete' : ' active') : '')}>
              {step > 1 ? <IconCheck size={12} /> : '1'}
            </div>
            <div className={'pc-step-text' + (step >= 1 ? ' active' : '')}>Identificação</div>
          </div>
          <div className="pc-step-connector">
            <div ref={stepFillRef} className="pc-step-fill" />
          </div>
          <div className="pc-step-item">
            <div className={'pc-step-dot' + (step >= 2 ? ' active' : '')}>2</div>
            <div className={'pc-step-text' + (step >= 2 ? ' active' : '')}>Endereço</div>
          </div>
        </div>

        {/* Step 1 */}
        <div ref={step1Ref} className="pc-fm-row" style={{
          marginTop: 24, display: step === 1 ? 'flex' : 'none', flexDirection: 'column', gap: 16,
        }}>
          <div className="pc-field">
            <label className="pc-field-label">Nome do ponto</label>
            <input {...inp} type="text" placeholder="Ex: Ginásio Municipal Ayrton Senna"
              value={form.nomeLocal} onChange={e => set('nomeLocal', e.target.value)} />
          </div>
          <div className="pc-field">
            <label className="pc-field-label">CNPJ</label>
            <input {...inp} type="text" inputMode="numeric" placeholder="00.000.000/0000-00"
              value={form.cnpj} onChange={e => set('cnpj', formatCNPJ(e.target.value))} maxLength={18} />
          </div>
          <div className="pc-field">
            <label className="pc-field-label">Telefone</label>
            <input {...inp} type="text" placeholder="(12) 99999-9999"
              value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          </div>
          <div className="pc-field">
            <label className="pc-field-label">Tipo de ponto</label>
            <div style={{ display: 'flex', gap: 10 }}>
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
        </div>

        {/* Step 2 */}
        <div ref={step2Ref} className="pc-fm-row" style={{
          marginTop: 24, display: step === 2 ? 'flex' : 'none', flexDirection: 'column', gap: 16,
        }}>
          {/* CEP com autocomplete */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
            <div className="pc-field">
              <label className="pc-field-label">CEP</label>
              <div style={{ position: 'relative' }}>
                <input {...inp} type="text" inputMode="numeric" placeholder="00000-000"
                  value={form.cep}
                  onChange={e => handleCepChange(e.target.value)}
                  style={{ paddingRight: 28 }}
                />
                {cepStatus === 'loading' && (
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--t3)' }}>⟳</span>
                )}
                {cepStatus === 'ok' && (
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#22c55e' }}>✓</span>
                )}
              </div>
              {cepStatus === 'error' && (
                <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>CEP não encontrado.</div>
              )}
            </div>
            <div className="pc-field">
              <label className="pc-field-label">Cidade</label>
              <input {...inp} type="text" placeholder="Taubaté"
                value={form.cidade} onChange={e => set('cidade', e.target.value)} />
            </div>
          </div>
          <div className="pc-field">
            <label className="pc-field-label">Rua / logradouro</label>
            <input {...inp} type="text" placeholder="Rua das Flores"
              value={form.rua} onChange={e => set('rua', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <div className="pc-field">
              <label className="pc-field-label">Número</label>
              <input {...inp} type="text" placeholder="100"
                value={form.numero} onChange={e => set('numero', e.target.value)} />
            </div>
            <div className="pc-field">
              <label className="pc-field-label">Bairro</label>
              <input {...inp} type="text" placeholder="Centro"
                value={form.bairro} onChange={e => set('bairro', e.target.value)} />
            </div>
          </div>
          <div className="pc-field">
            <label className="pc-field-label">E-mail (opcional)</label>
            <input {...inp} type="email" placeholder="contato@ponto.org"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>

        {error && (
          <div className="pc-fm-row pc-err-box" style={{ marginTop: 16 }}>
            <IconX size={14} /><span>{error}</span>
          </div>
        )}

        <div className="pc-fm-row" style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          {step === 1 ? (
            <>
              <button type="button" className="pc-btn pc-btn-ghost" onClick={onBack}>
                <IconArrowLeft size={14} /> Voltar
              </button>
              <button type="button" className="pc-btn pc-btn-primary" disabled={!step1Valid}
                onClick={() => goToStep(2)} style={{ flex: 1 }}>
                Próximo <IconArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button type="button" className="pc-btn pc-btn-ghost" onClick={() => goToStep(1)}>
                <IconArrowLeft size={14} /> Voltar
              </button>
              <button ref={submitRef} type="button" className="pc-btn pc-btn-primary"
                disabled={!step2Valid || submitting} onClick={handleSubmit} style={{ flex: 1 }}>
                {submitting ? <IconLoader /> : <IconCheck size={14} />}
                {submitting ? 'Enviando…' : 'Enviar cadastro'}
              </button>
            </>
          )}
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
