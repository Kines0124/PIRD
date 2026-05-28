import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Scanline, Logo, GlobalFooter, IconArrowLeft, CATEGORIA_CONFIG, SUBITENS_POR_CATEGORIA } from './shared';
import { getMinhasDemandas, getMinhasDoacoes } from '../../services/pontoColetaApi';

const CATEGORIAS_ORDER = ['solido', 'liquido', 'dormitorios', 'roupas', 'higiene_limpeza'];

export default function PontoColetaEstoque({ onBack }) {
  const containerRef = useRef(null);
  const [demandas,  setDemandas]  = useState([]);
  const [doacoes,   setDoacoes]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState({});

  useEffect(() => {
    Promise.all([getMinhasDemandas(), getMinhasDoacoes()])
      .then(([dem, doa]) => {
        setDemandas(dem);
        setDoacoes(doa.filter(d => d.status === 'recebida'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useGSAP(() => {
    if (loading) return;
    gsap.from('.pc-est-row', {
      opacity: 0, y: 14, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.2,
    });
  }, { scope: containerRef, dependencies: [loading] });

  // Todos os subitens predefinidos com quantidade recebida (0 se nenhuma doação)
  function getSubitensPorCat(cat) {
    const porItem = {};
    doacoes
      .filter(d => d.categoriaItem === cat && d.descricaoItem)
      .forEach(d => {
        porItem[d.descricaoItem] = (porItem[d.descricaoItem] || 0) + d.quantidade;
      });
    return (SUBITENS_POR_CATEGORIA[cat] || []).map(sub => [sub, porItem[sub] || 0]);
  }

  const categorias = CATEGORIAS_ORDER.filter(cat => demandas.some(d => d.categoria === cat));

  return (
    <div className="pc-page" ref={containerRef}>
      <Scanline />

      <header className="pc-app-header">
        <div className="pc-app-header-left"><Logo size="sm" /></div>
        <div className="pc-app-header-right">
          <button className="pc-app-header-link" onClick={onBack}>
            <IconArrowLeft size={12} /> Voltar
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 32px' }}>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.025em', color: 'var(--t1)', lineHeight: 1.1 }}>
            Ver Estoque
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)', marginTop: 10, letterSpacing: '0.04em' }}>
            Estoque por categoria · detalhes de itens recebidos
          </div>
        </div>

        <div className="pc-section-label" style={{ marginBottom: 16 }}>
          <span>Categorias</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)' }}>
            Carregando…
          </div>
        ) : categorias.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 0',
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)',
            border: '1px dashed var(--bd)', borderRadius: 'var(--radius)',
          }}>
            Nenhuma demanda cadastrada ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categorias.map(cat => {
              const cfg      = CATEGORIA_CONFIG[cat] || { label: cat, unit: 'un', cor: '#8B949E' };
              const demanda  = demandas.find(d => d.categoria === cat);
              const recebido = demanda?.quantidadeRecebida || 0;
              const total    = demanda?.quantidadeDemanda  || 0;
              const pct      = total > 0 ? Math.round((recebido / total) * 100) : 0;
              const isOpen   = !!expanded[cat];
              const subitens = getSubitensPorCat(cat);

              return (
                <div key={cat} className="pc-est-row" style={{
                  background:   'var(--surf-1)',
                  border:       `1px solid ${isOpen ? cfg.cor + '33' : 'var(--bd)'}`,
                  borderRadius: 'var(--radius-lg)',
                  overflow:     'hidden',
                  transition:   'border-color 0.2s',
                }}>
                  <button
                    type="button"
                    onClick={() => setExpanded(p => ({ ...p, [cat]: !p[cat] }))}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 14, padding: '18px 22px', background: 'none',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontSize: 9, color: 'var(--t3)', flexShrink: 0,
                      display: 'inline-block',
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}>▶</span>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.cor, boxShadow: `0 0 0 3px ${cfg.cor}22`, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--t1)', flex: 1 }}>
                      {cfg.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t2)' }}>
                        {recebido.toLocaleString('pt-BR')} / {total.toLocaleString('pt-BR')} {cfg.unit}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: cfg.cor, minWidth: 32, textAlign: 'right' }}>
                        {pct}%
                      </span>
                    </div>
                  </button>

                  <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', margin: '0 22px' }}>
                    <div style={{
                      height: '100%', background: cfg.cor, opacity: 0.7,
                      width: `${Math.min(pct, 100)}%`, transition: 'width 0.5s ease',
                    }} />
                  </div>

                  {isOpen && (
                    <div style={{ padding: '8px 22px 18px', borderTop: '1px solid var(--bd)', marginTop: 10 }}>
                      {subitens.map(([item, qtd], idx) => {
                          const iPct = total > 0 ? Math.round((qtd / total) * 100) : 0;
                          return (
                            <div key={item} style={{
                              display:             'grid',
                              gridTemplateColumns: '1fr auto 100px 44px',
                              alignItems:          'center',
                              gap:                 12,
                              padding:             '9px 0',
                              borderBottom:        idx < subitens.length - 1 ? '1px dashed var(--bd)' : 'none',
                            }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t1)', letterSpacing: '0.03em' }}>
                                {item}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
                                {qtd} {cfg.unit}
                              </span>
                              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: cfg.cor, opacity: 0.6, width: `${Math.min(iPct, 100)}%` }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: cfg.cor, textAlign: 'right' }}>
                                {iPct}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <GlobalFooter />
    </div>
  );
}
