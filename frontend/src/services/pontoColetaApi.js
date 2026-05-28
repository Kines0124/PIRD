const BASE = "http://localhost:8080";

const TOKEN_KEY = "pc_token";
const NOME_KEY  = "pc_nome";
const CNPJ_KEY  = "pc_cnpj";

export function isAuthenticated() { return !!sessionStorage.getItem(TOKEN_KEY); }
export function getNome()         { return sessionStorage.getItem(NOME_KEY) || ""; }
export function getCnpj()         { return sessionStorage.getItem(CNPJ_KEY) || ""; }

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(NOME_KEY);
  sessionStorage.removeItem(CNPJ_KEY);
}

async function req(method, path, body, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function loginPonto(cnpj, senha) {
  const data = await req("POST", "/auth/login/ponto", { cnpj, senha }, false);
  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(NOME_KEY,  data.nome);
  sessionStorage.setItem(CNPJ_KEY,  data.identifier);
  return data;
}

export async function registrar(dto) {
  return req("POST", "/registro-pontos-coleta", dto, false);
}

export async function buscarStatusRegistro(cnpj) {
  return req("GET", `/registro-pontos-coleta/status/${encodeURIComponent(cnpj)}`, null, false);
}

export async function getMeuPerfil() {
  return req("GET", "/pontos-coleta/meu");
}

export async function getMinhasDemandas() {
  return req("GET", "/pontos-coleta/meu/demandas");
}

export async function criarDemanda(dto) {
  return req("POST", "/pontos-coleta/meu/demandas", dto);
}

export async function atualizarEstoque(demandaId, quantidadeRecebida) {
  return req("PATCH", `/pontos-coleta/meu/demandas/${demandaId}/estoque`, { quantidadeRecebida });
}

export async function atualizarLimite(demandaId, quantidadeDemanda) {
  return req("PATCH", `/pontos-coleta/meu/demandas/${demandaId}/limite`, { quantidadeDemanda });
}

export async function getMinhasDoacoes() {
  return req("GET", "/pontos-coleta/meu/doacoes");
}

export async function marcarRecebida(doacaoId) {
  return req("PATCH", `/doacoes/${doacaoId}/recebida`, null);
}

// ── Públicos (formulário de doação) ──────────────────────────────────────────

export async function getPontosValidados() {
  return req("GET", "/pontos-coleta/validados", null, false);
}

export async function getDemandas(pontoId) {
  return req("GET", `/pontos-coleta/${pontoId}/demandas`, null, false);
}

export async function criarDoacao(dto) {
  return req("POST", "/doacoes", dto, false);
}
