import './pontoColeta.css';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, logout } from '../../services/pontoColetaApi';
import PontoColetaLogin      from './PontoColetaLogin';
import PontoColetaFormulario from './PontoColetaFormulario';
import PontoColetaAguardando from './PontoColetaAguardando';
import PontoColetaDashboard  from './PontoColetaDashboard';
import PontoColetaDoacoes    from './PontoColetaDoacoes';
import PontoColetaCapacidade from './PontoColetaCapacidade';
import PontoColetaEstoque    from './PontoColetaEstoque';

export default function PontoColetaApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState(() => {
    if (isAuthenticated()) return 'dashboard';
    if (location.pathname === '/pontos-coleta/novo') return 'formulario';
    return 'login';
  });
  const [registro, setRegistro] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRegistroSubmit = (result) => {
    setRegistro(result);
    setView('aguardando');
  };

  return (
    <div className="pc-root">
      {view === 'login' && (
        <PontoColetaLogin
          onLogin={() => setView('dashboard')}
          onBack={() => navigate('/login')}
        />
      )}
      {view === 'formulario' && (
        <PontoColetaFormulario
          onSubmit={handleRegistroSubmit}
          onBack={() => navigate('/login')}
        />
      )}
      {view === 'aguardando' && (
        <PontoColetaAguardando
          registro={registro}
          onLogout={() => navigate('/login')}
        />
      )}
      {view === 'dashboard' && (
        <PontoColetaDashboard
          onLogout={handleLogout}
          onVerDoacoes={() => setView('doacoes')}
          onCadastrarDemandas={() => setView('capacidade')}
          onVerEstoque={() => setView('estoque')}
        />
      )}
      {view === 'doacoes' && (
        <PontoColetaDoacoes
          onBack={() => setView('dashboard')}
          onLogout={handleLogout}
        />
      )}
      {view === 'capacidade' && (
        <PontoColetaCapacidade
          onBack={() => setView('dashboard')}
        />
      )}
      {view === 'estoque' && (
        <PontoColetaEstoque
          onBack={() => setView('dashboard')}
        />
      )}
    </div>
  );
}
