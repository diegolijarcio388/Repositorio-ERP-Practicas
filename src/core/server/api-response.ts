export const jsonOk = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const jsonError = (message: string, status = 400): Response =>
  jsonOk({ error: message }, status);
