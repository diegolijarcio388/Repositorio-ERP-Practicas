import type { AuthenticatedApiUser } from "../../vacations/domain/types";
import type {
  CreateTimeControlTrustedNetworkInput,
  TimeControlTrustedNetwork,
  TrustedNetworkType,
  UpdateTimeControlTrustedNetworkInput,
} from "../domain/types";
import {
  createTimeControlTrustedNetworksRepository,
  type TimeControlTrustedNetworksRepository,
} from "../repositories/time-control-trusted-networks.repository";

type TrustedNetworkRule =
  | { kind: "exact"; value: string }
  | { kind: "cidr4"; network: number; mask: number };

interface CreateTrustedNetworkRequest {
  name: string;
  networkValue: string;
  networkType: TrustedNetworkType;
  isActive?: boolean;
  description?: string | null;
}

interface UpdateTrustedNetworkRequest {
  id: string;
  name?: string;
  networkValue?: string;
  networkType?: TrustedNetworkType;
  isActive?: boolean;
  description?: string | null;
}

interface DatabaseLikeError {
  code?: string;
  errno?: number;
  message?: string;
}

const hasGlobalTimeControlManagement = (
  user: AuthenticatedApiUser,
): boolean => user.role === "admin" || user.canManageTimeControlRequests;

const ensureTimeControlNetworkManagement = (
  user: AuthenticatedApiUser,
): void => {
  if (!hasGlobalTimeControlManagement(user)) {
    throw new Error("FORBIDDEN");
  }
};

const getTrustedNetworkFallbackConfig = (): string => {
  const env = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;

  return env?.TIME_CONTROL_TRUSTED_IP_RANGES?.trim() || "127.0.0.1/32,::1";
};

const normalizeIpAddress = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withoutIpv6Prefix = trimmed.startsWith("::ffff:")
    ? trimmed.slice("::ffff:".length)
    : trimmed;
  const bracketMatch = withoutIpv6Prefix.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketMatch?.[1]) {
    return bracketMatch[1];
  }

  const ipv4WithPortMatch = withoutIpv6Prefix.match(
    /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/,
  );
  if (ipv4WithPortMatch?.[1]) {
    return ipv4WithPortMatch[1];
  }

  return withoutIpv6Prefix;
};

const parseIpv4ToInt = (value: string): number | null => {
  const parts = value.split(".");
  if (parts.length !== 4) {
    return null;
  }

  let result = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return null;
    }

    const number = Number(part);
    if (!Number.isInteger(number) || number < 0 || number > 255) {
      return null;
    }

    result = (result << 8) | number;
  }

  return result >>> 0;
};

const buildIpv4Mask = (prefixLength: number): number => {
  if (prefixLength <= 0) {
    return 0;
  }

  return (0xffffffff << (32 - prefixLength)) >>> 0;
};

const parseCidrRule = (value: string): TrustedNetworkRule | null => {
  const normalized = normalizeIpAddress(value);
  if (!normalized || !normalized.includes("/")) {
    return null;
  }

  const [rawIp, rawPrefix] = normalized.split("/");
  const prefixLength = Number(rawPrefix);
  const ipv4Value = parseIpv4ToInt(rawIp);

  if (
    ipv4Value === null ||
    !Number.isInteger(prefixLength) ||
    prefixLength < 0 ||
    prefixLength > 32
  ) {
    return null;
  }

  const mask = buildIpv4Mask(prefixLength);
  return {
    kind: "cidr4",
    network: ipv4Value & mask,
    mask,
  };
};

const parseExactRule = (value: string): TrustedNetworkRule | null => {
  const normalized = normalizeIpAddress(value);
  if (!normalized || normalized.includes("/")) {
    return null;
  }

  return { kind: "exact", value: normalized };
};

const parseFallbackRule = (entry: string): TrustedNetworkRule | null => {
  const normalized = normalizeIpAddress(entry);
  if (!normalized) {
    return null;
  }

  if (normalized.includes("/")) {
    return parseCidrRule(normalized);
  }

  return parseExactRule(normalized);
};

const parseRepositoryRule = (
  network: TimeControlTrustedNetwork,
): TrustedNetworkRule | null => {
  if (network.networkType === "CIDR") {
    return parseCidrRule(network.networkValue);
  }

  return parseExactRule(network.networkValue);
};

const matchesRules = (
  normalizedIp: string,
  ipv4Value: number | null,
  rules: TrustedNetworkRule[],
): boolean =>
  rules.some((rule) => {
    if (rule.kind === "exact") {
      return rule.value === normalizedIp;
    }

    return ipv4Value !== null && (ipv4Value & rule.mask) === rule.network;
  });

const validateNetworkValue = (
  networkType: TrustedNetworkType,
  networkValue: string,
): string => {
  const trimmed = networkValue.trim();
  if (!trimmed) {
    throw new Error("El valor de red es obligatorio.");
  }

  const normalized = normalizeIpAddress(trimmed);
  if (!normalized) {
    throw new Error("El valor de red no es válido.");
  }

  const parsedRule =
    networkType === "CIDR"
      ? parseCidrRule(normalized)
      : parseExactRule(normalized);

  if (!parsedRule) {
    throw new Error(
      networkType === "CIDR"
        ? "Debes indicar un rango CIDR válido."
        : "Debes indicar una IP exacta válida.",
    );
  }

  return normalized;
};

const isDuplicateTrustedNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as DatabaseLikeError;
  if (candidate.code === "ER_DUP_ENTRY" || candidate.errno === 1062) {
    return true;
  }

  const message = candidate.message?.toLowerCase() ?? "";
  return (
    message.includes("duplicate entry") ||
    message.includes("uq_time_control_trusted_networks_value")
  );
};

const toTrustedNetworkPersistenceError = (
  error: unknown,
  fallbackMessage: string,
): Error => {
  if (isDuplicateTrustedNetworkError(error)) {
    return new Error("Ya existe una red confiable con ese valor.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
};

export class TimeControlTrustedNetworksService {
  constructor(
    private readonly repository: TimeControlTrustedNetworksRepository = createTimeControlTrustedNetworksRepository(),
  ) {}

  async getTrustedNetworkChecker(): Promise<(value?: string | null) => boolean> {
    const persistedRules = (await this.repository.listActive())
      .map((network) => parseRepositoryRule(network))
      .filter((rule): rule is TrustedNetworkRule => rule !== null);

    const fallbackRules = getTrustedNetworkFallbackConfig()
      .split(/[\s,;]+/)
      .map((entry) => parseFallbackRule(entry))
      .filter((rule): rule is TrustedNetworkRule => rule !== null);

    return (value?: string | null): boolean => {
      const normalizedIp = normalizeIpAddress(value);
      if (!normalizedIp) {
        return false;
      }

      const ipv4Value = parseIpv4ToInt(normalizedIp);

      if (matchesRules(normalizedIp, ipv4Value, persistedRules)) {
        return true;
      }

      return matchesRules(normalizedIp, ipv4Value, fallbackRules);
    };
  }

  async listNetworks(
    user: AuthenticatedApiUser,
  ): Promise<TimeControlTrustedNetwork[]> {
    ensureTimeControlNetworkManagement(user);
    return this.repository.listAll();
  }

  async createNetwork(
    user: AuthenticatedApiUser,
    input: CreateTrustedNetworkRequest,
  ): Promise<TimeControlTrustedNetwork> {
    ensureTimeControlNetworkManagement(user);

    const name = input.name.trim();
    if (!name) {
      throw new Error("El nombre de la red es obligatorio.");
    }

    const networkValue = validateNetworkValue(
      input.networkType,
      input.networkValue,
    );
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const payload: CreateTimeControlTrustedNetworkInput = {
      id: crypto.randomUUID(),
      name,
      networkValue,
      networkType: input.networkType,
      isActive: input.isActive ?? true,
      description: input.description?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      return await this.repository.create(payload);
    } catch (error) {
      throw toTrustedNetworkPersistenceError(
        error,
        "No se pudo crear la red confiable.",
      );
    }
  }

  async updateNetwork(
    user: AuthenticatedApiUser,
    input: UpdateTrustedNetworkRequest,
  ): Promise<TimeControlTrustedNetwork> {
    ensureTimeControlNetworkManagement(user);

    const existing = await this.repository.findById(input.id);
    if (!existing) {
      throw new Error("No se encontró la red confiable.");
    }

    const nextNetworkType = input.networkType ?? existing.networkType;
    const nextNetworkValue = validateNetworkValue(
      nextNetworkType,
      input.networkValue ?? existing.networkValue,
    );
    const name =
      input.name !== undefined ? input.name.trim() : existing.name;

    if (!name) {
      throw new Error("El nombre de la red es obligatorio.");
    }

    const payload: UpdateTimeControlTrustedNetworkInput = {
      id: input.id,
      name,
      networkType: nextNetworkType,
      networkValue: nextNetworkValue,
      isActive: input.isActive,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : undefined,
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    try {
      return await this.repository.update(payload);
    } catch (error) {
      throw toTrustedNetworkPersistenceError(
        error,
        "No se pudo actualizar la red confiable.",
      );
    }
  }

  async setNetworkActive(
    user: AuthenticatedApiUser,
    id: string,
    isActive: boolean,
  ): Promise<void> {
    ensureTimeControlNetworkManagement(user);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("No se encontró la red confiable.");
    }

    await this.repository.setActive(
      id,
      isActive,
      new Date().toISOString().slice(0, 19).replace("T", " "),
    );
  }
}

export const createTimeControlTrustedNetworksService =
  (): TimeControlTrustedNetworksService =>
    new TimeControlTrustedNetworksService();
