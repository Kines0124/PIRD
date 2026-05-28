import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function Scanline() {
  const ref = useRef(null);
  useGSAP(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { y: '-100%', opacity: 0 },
      { y: '110vh', opacity: 0.5, duration: 0.55, ease: 'power2.in',
        onComplete: () => { if (ref.current) gsap.to(ref.current, { opacity: 0, duration: 0.2 }); }
      }
    );
  });
  return <div ref={ref} className="pc-scanline" />;
}

export function Logo({ size = 'md' }) {
  const markCls = 'pc-logo-mark' + (size === 'sm' ? ' sm' : size === 'lg' ? ' lg' : '');
  const wordSize = size === 'lg' ? 22 : size === 'sm' ? 13 : 16;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className={markCls}>+</span>
      <div>
        <div className="pc-logo-wordmark" style={{ fontSize: wordSize }}>BASE</div>
        <div className="pc-logo-tagline" style={{ fontSize: size === 'sm' ? 9 : 10 }}>Pontos de Coleta</div>
      </div>
    </div>
  );
}

export function GlobalFooter() {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)',
      letterSpacing: '0.1em', textAlign: 'center', padding: '24px 16px', opacity: 0.5,
    }}>
      SISTEMA BASE · TAUBATÉ — SP · © 2026
    </div>
  );
}

export function IconCheck({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
export function IconX({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
export function IconArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pc-btn-arrow">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
export function IconArrowLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
export function IconLogout({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
export function IconEdit({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
export function IconLoader({ size = 14 }) {
  return (
    <svg className="pc-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
export function IconClock({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
export function IconBan({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}
export function IconPlus({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
export function IconArchive({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  );
}
export function IconList({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export const CATEGORIA_CONFIG = {
  solido:          { label: 'Alimentos',     unit: 'Kg',  cor: '#F97316' },
  liquido:         { label: 'Bebidas',       unit: 'L',   cor: '#38BDF8' },
  dormitorios:     { label: 'Dormitórios',   unit: 'un',  cor: '#818CF8' },
  roupas:          { label: 'Roupas',        unit: 'un',  cor: '#A78BFA' },
  higiene_limpeza: { label: 'Higiene Pessoal', unit: 'un', cor: '#34D399' },
};

export const SUBITENS_POR_CATEGORIA = {
  solido:          ['Arroz', 'Feijão', 'Macarrão', 'Farinha', 'Açúcar', 'Óleo'],
  liquido:         ['Água mineral', 'Leite', 'Suco'],
  dormitorios:     ['Colchão', 'Cobertor', 'Travesseiro', 'Lençol'],
  roupas:          ['Blusa', 'Calça', 'Agasalho', 'Calçado', 'Meias', 'Casaco'],
  higiene_limpeza: ['Sabonete', 'Shampoo', 'Pasta de dente', 'Fralda'],
};

export const CATEGORIA_COR = {
  'alimento':       '#F97316',
  'agua':           '#38BDF8',
  'roupas':         '#A78BFA',
  'medicamento':    '#4ADE80',
  'higiene':        '#FB923C',
  'solido':         '#F97316',
  'liquido':        '#38BDF8',
  'dormitorios':    '#818CF8',
  'higiene_limpeza':'#34D399',
};

export function formatCNPJ(v) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2)  return d;
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}
