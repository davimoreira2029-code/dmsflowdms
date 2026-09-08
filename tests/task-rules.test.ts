import { describe, it, expect } from "vitest";
import { canChangeTaskStatus } from "@/server/services/task-rules";

describe("canChangeTaskStatus (server/services/task-rules.ts)", () => {
  it("permite quem tem MANAGE_TASKS, mesmo não sendo o responsável", () => {
    expect(canChangeTaskStatus("user-a", "user-b", true)).toBe(true);
  });

  it("permite o próprio responsável, mesmo sem MANAGE_TASKS", () => {
    expect(canChangeTaskStatus("user-a", "user-a", false)).toBe(true);
  });

  it("bloqueia quem não é responsável e não tem MANAGE_TASKS", () => {
    expect(canChangeTaskStatus("user-a", "user-b", false)).toBe(false);
  });

  it("bloqueia quando não há responsável definido e falta permissão", () => {
    expect(canChangeTaskStatus("user-a", null, false)).toBe(false);
  });
});
