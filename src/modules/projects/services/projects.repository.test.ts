import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createProjectsRepository } from "./projects.repository";
import {
  installWindowLocalStorageMock,
  removeWindowMock,
} from "../../../test/utils/browser-mocks";

describe("projects.repository", () => {
  beforeEach(() => {
    installWindowLocalStorageMock();
  });

  afterEach(() => {
    removeWindowMock();
  });

  it("rechaza codigo duplicado en el mismo año", async () => {
    const repository = createProjectsRepository();

    await expect(
      repository.upsert(2026, {
        code: "ERP-101",
        name: "Proyecto duplicado",
        status: "Activo",
        budgetHours: null,
      }),
    ).rejects.toThrow("El codigo ya existe para el año seleccionado.");
  });

  it("permite presupuesto opcional (null) y guarda sin error", async () => {
    const repository = createProjectsRepository();

    const created = await repository.upsert(2028, {
      code: "ERP-801",
      name: "Proyecto sin tope",
      status: "Activo",
      budgetHours: null,
    });

    expect(created.budgetHours).toBeNull();
    expect(created.code).toBe("ERP-801");
  });
});
