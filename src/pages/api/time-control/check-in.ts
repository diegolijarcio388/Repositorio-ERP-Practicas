import type { APIRoute } from "astro";
import { jsonOk } from "../../../core/server/api-response";
import { withApiError } from "../../../core/server/api-handler";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createTimeControlService } from "../../../modules/time-control/services/time-control.service";

const timeControlService = createTimeControlService();

const getClientIpAddress = (request: Request): string | null => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) {
    return cfIp;
  }

  return null;
};

const getUserAgent = (request: Request): string | null => {
  const value = request.headers.get("user-agent")?.trim() ?? "";
  return value || null;
};

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await context.request.json();
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const deviceType =
    typeof body?.deviceType === "string" ? body.deviceType : undefined;
  const deviceReason =
    typeof body?.deviceReason === "string" ? body.deviceReason : undefined;
  const tabletCode =
    typeof body?.tabletCode === "string" ? body.tabletCode : undefined;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("La ubicación es obligatoria para fichar la entrada.");
  }

  const item = await timeControlService.checkIn(user, {
    latitude,
    longitude,
    deviceType,
    ipAddress: getClientIpAddress(context.request),
    userAgent: getUserAgent(context.request),
    deviceReason,
    tabletCode,
  });
  return jsonOk({ item });
});
