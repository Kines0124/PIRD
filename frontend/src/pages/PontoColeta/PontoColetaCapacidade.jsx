import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Scanline, Logo, GlobalFooter,
  IconCheck, IconLoader, FixedBackButton,
  CATEGORIA_CONFIG,
} from './shared';
import { getMinhasDemandas, criarDemanda, atualizarLimite } from '../../services/pontoColetaApi';

const CATEGORIAS = ['solido', 'liquido', 'dormitorios', 'roupas', 'higiene_limpeza'];

function buildInitialLimites() {
  const obj = {};
  CATEGORIAS.forEach(cat => { obj[cat] = ''; });
  return obj;
}

export default function PontoColetaCapacidade({ onBack }) {
  const containerRef = useRef(null);

  const [demandas,  setDemandas]  = useState([]);
  const [limites,   setLimites]   = useState(buildInitialLimites);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [erro,      setErro]      = useState('');

  useEffect(() => {
    getMinhasDemandas()
      .then(data => {
        setDemandas(data);
        const pre = buildInitialLimites();
        data.forEach(d => {
          if (pre[d.categoria] !== undefined) {
            pre[d.categoria] = String(d.quantidadeDemanda);
          }
        });
        setLimites(pre);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useGSAP(() => {
    if (loading) return;
    gsap.from('.pc-cap-cat-block', {
      opacity: 0, y: 14, stagger: 0.07, duration: 0.38, ease: 'power2.out', delay: 0.15,
    });
    gsap.from('.pc-cap-footer', { opacity: 0, y: 8, duration: 0.3, delay: 0.55 });
  }, { scope: containerRef, dependencies: [loading] });

  const handleSave = async () => {
    setErro('');

    const violations = [];
    CATEGORIAS.forEach(cat => {
      const val = parseInt(limites[cat]) || 0;
      if (val < 1) return;
      const existing = demandas.find(d => d.categoria === cat);
      if (existing && val < existing.quantidadeRecebida) {
        violations.push(CATEGORIA_CONFIG[cat].label);
      }
    });

    if (violations.length > 0) {
      setErro(`Não é possível reduzir o limite abaixo do estoque já recebido: ${violations.join(', ')}.`);
      return;
    }

    setSaving(true);
    try {
      const promises = [];
      CATEGORIAS.forEach(cat => {
        const val = parseInt(limites[cat]) || 0;
        if (val < 1) return;
        const existing = demandas.find(d => d.categoria === cat);
        if (existing) {
          promises.push(atualizarLimite(existing.id, val));
        } else {
          promises.push(criarDemanda({
            categoria:         cat,
            descricaoItem:     cat,
            quantidadeDemanda: val,
            prioridade:        null,
          }));
        }
      });
      await Promise.all(promises);

      const updated = await getMinhasDemandas();
      setDemandas(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    }
    setSaving(false);
  };

  const setLimite = (cat, raw) =>
    setLimites(prev => ({ ...prev, [cat]: raw.replace(/\D/g, '') }));

  return (
    <div className="pc-page" ref={containerRef}>
      <Scanline />

      <FixedBackButton onClick={onBack} />

      <header className="pc-app-header">
        <div className="pc-app-header-left"><Logo size="sm" /></div>
        <div className="pc-app-header-right">
          <div className="pc-status-badge" style={{ fontSize: 9 }}>
            <span className="pc-status-dot active" /> Validado
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 32px 32px' }}>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.025em', color: 'var(--t1)', lineHeight: 1.1 }}>
            Cadastrar Demandas
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)', marginTop: 10, letterSpacing: '0.04em' }}>
            Defina a quantidade necessária por categoria
          </div>
        </div>

        <div className="pc-section-label" style={{ marginBottom: 16 }}>
          <span>Necessidade por categoria</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)' }}>
            Carregando…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORIAS.map(cat => {
              const cfg      = CATEGORIA_CONFIG[cat];
              const existing = demandas.find(d => d.categoria === cat);

              return (
                <div key={cat} className="pc-cap-cat-block" style={{
                  background:   'var(--surf-1)',
                  border:       '1px solid var(--bd)',
                  borderRadius: 'var(--radius-lg)',
                  padding:      '14px 20px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          16,
                  transition:   'border-color 0.2s',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.cor, boxShadow: `0 0 0 3px ${cfg.cor}22`, flexShrink: 0 }} />

                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--t1)', flex: 1 }}>
                    {cfg.label}
                  </span>

                  {existing && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
                      recebido: {existing.quantidadeRecebida}
                    </span>
                  )}

                  <div className="pc-field-wrap" style={{ width: 120, flexShrink: 0 }}>
                    <input
                      className="pc-field-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={limites[cat] || ''}
                      onChange={e => setLimite(cat, e.target.value)}
                      style={{
                        textAlign:    'right',
                        fontFamily:   'var(--font-display)',
                        fontWeight:   700,
                        fontSize:     16,
                        paddingRight: 36,
                        color:        cfg.cor,
                      }}
                    />
                    <span style={{
                      position:   'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', pointerEvents: 'none',
                    }}>
                      {cfg.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {erro && (
          <div className="pc-err-box" style={{ marginTop: 16 }}>{erro}</div>
        )}

        <div className="pc-cap-footer" style={{ marginTop: 24, display: 'flex', gap: 10 }}>
          <button className="pc-btn pc-btn-ghost" onClick={onBack} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button
            className="pc-btn pc-btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
            style={{ flex: 2 }}
          >
            {saving ? (
              <><IconLoader size={14} /> Salvando…</>
            ) : saved ? (
              <><IconCheck size={14} /> Salvo!</>
            ) : (
              'Salvar Demandas'
            )}
          </button>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
