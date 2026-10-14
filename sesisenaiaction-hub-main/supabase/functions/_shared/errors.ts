// Never serialize exception messages or request bodies into responses or logs.
export function internalFailure(operation: string, error: unknown, headers: Record<string, string>): Response {
  const incidentId = crypto.randomUUID();
  const rawCode = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
  const safeCodes = new Set(["23503", "23505", "23514", "42501", "PGRST116", "email_exists", "user_already_exists", "invalid_credentials", "weak_password", "over_request_rate_limit", "over_email_send_rate_limit"]);
  console.error(JSON.stringify({ operation, incident_id: incidentId, code: safeCodes.has(rawCode) ? rawCode : "unknown" }));
  return new Response(JSON.stringify({ error: "Não foi possível concluir a operação. Tente novamente ou informe o código ao suporte.", incident_id: incidentId }), {
    status: 500, headers: { ...headers, "Content-Type": "application/json" },
  });
}
