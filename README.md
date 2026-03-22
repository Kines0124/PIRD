# PIRD — Plataforma Integrada de Resposta a Desastres

Sistema de gerenciamento de ocorrências, coordenação de recursos e comunicação entre a Defesa Civil e a população de Taubaté, SP.

---

## Pré-requisitos

### Node.js

O projeto requer **Node.js versão 18 ou superior**.

**Windows:**
1. Acesse [https://nodejs.org](https://nodejs.org)
2. Baixe o instalador da versão **LTS** (recomendada)
3. Execute o instalador e siga os passos (deixe todas as opções padrão marcadas)
4. Após a instalação, abra um novo terminal e verifique:

```bash
node -v   # deve retornar v18.x.x ou superior
npm -v    # deve retornar a versão do npm
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install nodejs
node -v
npm -v
```

> Em caso de problemas na instalação, consulte a documentação oficial: [https://nodejs.org/en/download](https://nodejs.org/en/download)

---

## Instalação e execução

Clone ou extraia o projeto e, dentro da pasta `pird/`, execute os comandos abaixo.

**1. Instalar dependências** (necessário apenas na primeira vez, ou após mudanças no `package.json`):
```bash
npm install
```

**2. Rodar em modo de desenvolvimento:**
```bash
npm run dev
```

Após isso, acesse no navegador: **http://localhost:5173**

**3. Gerar build de produção:**
```bash
npm run build
```

**4. Visualizar o build de produção localmente:**
```bash
npm run preview
```

---

## Estrutura do projeto

```
pird/
├── index.html                        # Entry point HTML do Vite (fica na raiz, não em public/)
├── vite.config.js                    # Configuração do Vite
├── package.json                      # Dependências e scripts do projeto
├── .gitignore
├── README.md
│
├── public/                           # Arquivos estáticos servidos diretamente
│
└── src/
    ├── main.jsx                      # Entry point React — inicializa o app e configura Leaflet
    ├── App.jsx                       # Roteamento principal: controla perfil ativo e qual tela renderizar
    ├── index.css                     # Estilos globais (reset, body, ajustes do Leaflet)
    │
    ├── data/                         # ⚠ Dados mock — substituir por chamadas de API quando o backend estiver pronto
    │   ├── events.js                 # mockEvents: lista de ocorrências ativas
    │   ├── demands.js                # mockDemands: demandas de itens por evento
    │   ├── points.js                 # mockPoints: pontos de coleta cadastrados
    │   └── volunteers.js             # mockVolunteers: voluntários cadastrados
    │
    ├── constants/
    │   └── theme.js                  # Paleta de cores: severidade, status, categorias
    │
    ├── utils/
    │   └── geo.js                    # Funções puras: haversine(), formatDist(), pct()
    │
    ├── components/                   # Componentes reutilizáveis (sem lógica de negócio)
    │   ├── Tag.jsx                   # Badge colorido genérico
    │   ├── KpiCard.jsx               # Card de métrica com ícone e barra de destaque
    │   ├── PriorityBar.jsx           # Barra de progresso de atendimento de demanda
    │   ├── MapFocus.jsx              # Componente auxiliar do Leaflet para voar até coordenada
    │   └── Sidebar.jsx               # Menu lateral com navegação e mini-painel de status
    │
    ├── pages/                        # Telas completas, organizadas por módulo
    │   ├── Login/
    │   │   └── TelaLogin.jsx         # Tela inicial de seleção de perfil (Defesa Civil / Cidadão)
    │   │
    │   ├── Dashboard/
    │   │   ├── DashboardDefesa.jsx   # Visão de comando: KPIs, ocorrências, voluntários
    │   │   └── DashboardUsuario.jsx  # Visão do cidadão: demandas urgentes, pontos de coleta
    │   │
    │   ├── Ocorrencias/
    │   │   ├── Ocorrencias.jsx       # Lista de eventos com mini-mapa SVG
    │   │   ├── DetalheOcorrencia.jsx # Detalhe de evento: necessidades, coleta, voluntários
    │   │   └── FormNovoEvento.jsx    # Formulário de registro de nova ocorrência (Defesa Civil)
    │   │
    │   ├── PontosColeta/
    │   │   └── PontosColeta.jsx      # Cards + mapa Leaflet com geolocalização real
    │   │
    │   └── Portal/
    │       ├── PortalDefesa.jsx      # Visão da Defesa Civil: lista e match de voluntários
    │       └── PortalDoador.jsx      # Visão do cidadão: doação de itens e cadastro de voluntário
    │
    └── services/
        └── api.js                    # Camada HTTP — todas as chamadas ao backend ficam aqui
```

---

## Perfis de acesso

O sistema possui dois perfis selecionados na tela de login:

| Perfil | Acesso | Cor de destaque |
|--------|--------|-----------------|
| **Defesa Civil** | Dashboard de comando, registro de ocorrências, gestão de voluntários, portal completo | Vermelho `#ff3b3b` |
| **Cidadão** | Visualização de eventos, pontos de coleta, doações, cadastro como voluntário | Azul `#0ea5e9` |

---

## Onde mexer em cada situação

| Situação | Onde alterar |
|----------|-------------|
| Mudar cor ou label de severidade/status | `src/constants/theme.js` |
| Adicionar novo endpoint de API | `src/services/api.js` |
| Adicionar dados temporários para teste | `src/data/` |
| Criar componente visual reutilizável | `src/components/` |
| Criar nova tela ou módulo | `src/pages/NomeModulo/` |
| Mexer na navegação entre telas | `src/App.jsx` |
| Mexer no menu lateral | `src/components/Sidebar.jsx` |

---

## Dependências principais

| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `react` | ^18 | Biblioteca de UI |
| `react-dom` | ^18 | Renderização no DOM |
| `react-leaflet` | ^4 | Componentes de mapa para React |
| `leaflet` | ^1.9 | Biblioteca de mapas interativos |
| `vite` | ^5 | Bundler e servidor de desenvolvimento |