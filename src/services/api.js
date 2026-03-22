const BASE_URL = "http://localhost:3003";

export async function registrarEvento(payload) {
  const response = await fetch(`${BASE_URL}/api/evento`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Erro ao registrar evento");
  return response.json();
}
