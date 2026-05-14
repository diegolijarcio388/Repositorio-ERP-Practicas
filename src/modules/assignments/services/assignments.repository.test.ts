import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAssignmentsRepository } from "./assignments.repository";
import {
  installWindowLocalStorageMock,
  removeWindowMock,
} from "../../../test/utils/browser-mocks";

describe("assignments.repository", () => {
  beforeEach(() => {
    installWindowLocalStorageMock();
  });

  afterEach(() => {
    removeWindowMock();
  });

  it("normaliza email y evita duplicado por año/proyecto/usuario", async () => {
    const repository = createAssignmentsRepository();

    const created = await repository.assign(2026, {
      projectId: "pr-2026-x",
      userEmail: " Tecnico@EXAMPLE.com ",
      role: "Tecnico",
    });
    expect(created.userEmail).toBe("tecnico@example.com");

    await expect(
      repository.assign(2026, {
        projectId: "pr-2026-x",
        userEmail: "tecnico@example.com",
        role: "Consultor",
      }),
    ).rejects.toThrow("El trabajador ya esta asignado al proyecto en ese año.");
  });

  it("permite el mismo usuario en distintos proyectos", async () => {
    const repository = createAssignmentsRepository();

    await repository.assign(2026, {
      projectId: "pr-2026-a",
      userEmail: "empleado@example.com",
      role: "Tecnico",
    });

    await expect(
      repository.assign(2026, {
        projectId: "pr-2026-b",
        userEmail: "empleado@example.com",
        role: "Consultor",
      }),
    ).resolves.toBeDefined();
  });
});
