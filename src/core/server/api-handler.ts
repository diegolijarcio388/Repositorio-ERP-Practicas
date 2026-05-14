import type { APIRoute } from "astro";
import { jsonError } from "./api-response";

export const withApiError = (handler: APIRoute): APIRoute => {
  return async (context) => {
    try {
      return await handler(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
      if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
      return jsonError(message, 400);
    }
  };
};

export const parseJsonBody = async <T>(request: Request): Promise<T> => {
  return (await request.json()) as T;
};
