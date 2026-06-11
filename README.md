# PIRD — Plataforma Integrada de Resposta a Desastres

> Sistema full-stack para coordenação de emergências entre a Defesa Civil e a população, com gestão de voluntários, pontos de coleta, doações e monitoramento geográfico em tempo real.

---

## Visão Geral

O **PIRD** centraliza o fluxo de resposta a desastres em dois perfis de acesso:

| Perfil | Funcionalidades |
|---|---|
| **Defesa Civil** | Registro e acompanhamento de ocorrências, gestão de demandas, convocação de especialistas, monitoramento de pontos críticos |
| **Cidadão** | Visualização de eventos, cadastro como voluntário ou especialista, doações e consulta a pontos de coleta |

O sistema integra **mapas interativos** (Mapbox), **armazenamento de mídias em nuvem** (Cloudflare R2) e **dados geoespaciais** (PostGIS) para suporte a decisões em campo.

---

## Tecnologias

### Frontend
| Tecnologia | Versão |
|---|---|
| React | 18.3.1 |
| React Router DOM | 7.14.0 |
| Vite | 5.4.2 |
| Mapbox GL JS | 3.5.2 |
| GSAP | 3.12.0 |
| jsPDF | 4.2.1 |
| React Icons | 5.6.0 |
| Node.js | ≥ 18 (LTS recomendado) |

### Backend
| Tecnologia | Versão |
|---|---|
| Java | 21 |
| Spring Boot | 3.3.4 |
| Spring Security + JWT | java-jwt 4.4.0 |
| Spring Data JPA / Hibernate Spatial | — |
| PostgreSQL + PostGIS | postgis-jdbc 2023.1.0 |
| AWS SDK S3 (Cloudflare R2) | 2.25.70 |
| Springdoc OpenAPI (Swagger) | 2.6.0 |
| Maven | Wrapper incluso |

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Java 21** (JDK) — [download](https://adoptium.net/)
- **Node.js ≥ 18** (LTS) — [download](https://nodejs.org/)
- **PostgreSQL** com extensão **PostGIS** habilitada
- **Maven** não é necessário; o projeto inclui o Maven Wrapper (`mvnw`)

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/<seu-usuario>/pird.git
cd pird
```

### 2. Configure o banco de dados

Crie o banco e o usuário no PostgreSQL:

```sql
CREATE USER pird WITH PASSWORD 'pird';
CREATE DATABASE pird OWNER pird;
\c pird
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 3. Configure as variáveis de ambiente do backend

Crie o arquivo `backend/.env` com base no exemplo abaixo:

```env
# Mapbox
MAPBOX_TOKEN=seu_token_mapbox

# Cloudflare R2 (armazenamento de mídias)
ENDPOINT_URL_CLOUDFLARE=https://<account-id>.r2.cloudflarestorage.com
ACCESS_KEY_ID=sua_access_key
SECRET_ACCESS_KEY=sua_secret_key
CLOUDFLARE_PUBLIC_URL=https://pub-<id>.r2.dev
R2_BUCKET_NAME=pird
```

### 4. Configure as variáveis de ambiente do frontend

Crie o arquivo `frontend/.env.local`:

```env
VITE_MAPBOX_TOKEN=seu_token_mapbox
```

### 5. Instale as dependências do frontend

```bash
cd frontend
npm install
```

---

## Como Usar

### Backend (Spring Boot)

```bash
cd backend

# Linux / macOS
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

O servidor sobe em `http://localhost:8080`.

| Endpoint | URL |
|---|---|
| API REST | `http://localhost:8080` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |

### Frontend (React + Vite)

```bash
cd frontend
npm run dev
```

A aplicação abre em `http://localhost:5173`.

### Comandos adicionais

```bash
# Frontend — build de produção
npm run build

# Frontend — prévia do build
npm run preview

# Backend — gerar JAR executável
cd backend && ./mvnw clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar

# Backend — rodar testes
./mvnw test
```

---

## Estrutura do Projeto

```
pird/
├── frontend/                   # Aplicação React + Vite
│   ├── public/                 # Arquivos estáticos
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis (Sidebar, Map, KpiCard…)
│   │   ├── constants/          # Paleta de cores e tokens de design
│   │   ├── data/               # Dados mock (substituídos gradualmente pela API)
│   │   ├── hooks/              # Custom hooks React
│   │   ├── pages/
│   │   │   ├── Admin/          # Dashboard da Defesa Civil
│   │   │   ├── Especialista/   # Painel do especialista convocado
│   │   │   ├── EspecialistaForm/  # Cadastro de especialistas
│   │   │   ├── FormDoadores/   # Cadastro de doadores e voluntários
│   │   │   ├── Login/          # Tela de autenticação
│   │   │   └── PontoColeta/    # Módulo de pontos de coleta
│   │   ├── services/
│   │   │   └── api.js          # Camada de comunicação com o backend
│   │   └── utils/              # Funções utilitárias (cálculo geoespacial, etc.)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── backend/                    # API REST Spring Boot
    ├── src/main/java/com/pird/pirdBackend/
    │   ├── controller/         # Endpoints REST (16 controllers)
    │   ├── service/            # Regras de negócio (17+ serviços)
    │   ├── model/              # Entidades JPA com suporte geoespacial
    │   ├── dto/                # Data Transfer Objects (40+ classes)
    │   ├── repository/         # Repositórios Spring Data JPA
    │   └── security/           # Configuração JWT e filtros de segurança
    ├── src/main/resources/
    │   └── application.properties
    ├── pom.xml
    └── mvnw / mvnw.cmd         # Maven Wrapper
```
