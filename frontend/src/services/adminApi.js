const BASE = "http://localhost:8080";

function getToken() { return sessionStorage.getItem("admin_token"); }

export function isAuthenticated() { return !!getToken(); }
export function getAdminNome()    { return sessionStorage.getItem("admin_nome")  || "Admin"; }
export function getAdminEmail()   { return sessionStorage.getItem("admin_email") || ""; }

export function logout() {
  sessionStorage.removeItem("admin_token");
  sessionStorage.removeItem("admin_nome");
  sessionStorage.removeItem("admin_email");
}

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
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

export async function login(email, senha) {
  const data = await req("POST", "/auth/login", { email, senha });
  sessionStorage.setItem("admin_token", data.token);
  sessionStorage.setItem("admin_nome",  data.nome);
  sessionStorage.setItem("admin_email", email);
  return data;
}

export const getConvocacoes = () => req("GET", "/convocacoes");
export const getEventos         = ()      => req("GET",    "/eventos");
export const createEvento       = (form)  => req("POST",   "/eventos",       form);
export const updateEvento       = (id, f) => req("PUT",    `/eventos/${id}`,  f);
export const deleteEvento       = (id)    => req("DELETE", `/eventos/${id}`);

export const getPontosCriticos  = ()      => req("GET",    "/pontos-criticos");
export const createPontoCritico = (form)  => req("POST",   "/pontos-criticos",       form);
export const updatePontoCritico = (id, f) => req("PUT",    `/pontos-criticos/${id}`,  f);
export const deletePontoCritico = (id)    => req("DELETE", `/pontos-criticos/${id}`);

export const getVoluntarios     = ()      => req("GET",    "/voluntarios");
export const validarVoluntario  = (id)    => req("PATCH",  `/voluntarios/${id}/validar`);
export const deletarVoluntario  = (id)    => req("DELETE", `/voluntarios/${id}`);

export const getPontosColeta    = ()      => req("GET",    "/pontos-coleta");
export const validarPontoColeta = (id)    => req("PATCH",  `/pontos-coleta/${id}/validar`);
export const deletarPontoColeta = (id)    => req("DELETE", `/pontos-coleta/${id}`);

export const getRegistrosPontoColeta     = ()        => req("GET",   "/registro-pontos-coleta");
export const aprovarRegistroPontoColeta  = (id)      => req("PATCH", `/registro-pontos-coleta/${id}/aprovar`);
export const rejeitarRegistroPontoColeta = (id, obs) => req("PATCH", `/registro-pontos-coleta/${id}/rejeitar`, { observacao: obs });

export const getEspecialistas             = ()         => req("GET",    "/especialistas");
export const getEspecialistasAprovados    = ()         => req("GET",    "/especialistas/aprovados");
export const aprovarEspecialista          = (id)       => req("PATCH",  `/especialistas/${id}/aprovar`);
export const reprovarEspecialista         = (id, obs)  => req("PATCH",  `/especialistas/${id}/reprovar`, { observacao: obs });
export const deletarEspecialista          = (id)       => req("DELETE", `/especialistas/aprovados/${id}`);
export const deletarRegistroEspecialista  = (id)       => req("DELETE", `/especialistas/${id}`);

export const convocarManual       = (eventoId, especialistaId) => req("POST", `/convocacoes/evento/${eventoId}/manual`, { especialistaId });

export const getAdminPerfil    = ()     => req("GET", "/admin/perfil");
export const updateAdminPerfil = (data) => req("PUT", "/admin/perfil", data);

export const getFotosByEvento = (eventoId)            => req("GET",    `/eventos/${eventoId}/fotos`);
export const deletarFoto      = (eventoId, fotoId)    => req("DELETE", `/eventos/${eventoId}/fotos/${fotoId}`);

export async function uploadFoto(eventoId, file) {
  const formData = new FormData();
  formData.append("arquivo", file);
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/eventos/${eventoId}/fotos`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}
