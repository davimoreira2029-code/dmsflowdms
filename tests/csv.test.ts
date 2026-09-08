import { describe, it, expect } from "vitest";
import { arrayToCsv } from "@/lib/csv";

describe("arrayToCsv (lib/csv.ts)", () => {
  it("gera cabeçalho a partir das chaves do primeiro objeto", () => {
    const csv = arrayToCsv([{ nome: "João", idade: 30 }]);
    expect(csv.split("\n")[0]).toBe("nome,idade");
  });

  it("gera uma linha por item", () => {
    const csv = arrayToCsv([{ nome: "João" }, { nome: "Maria" }]);
    expect(csv.split("\n")).toEqual(["nome", "João", "Maria"]);
  });

  it("escapa valores com vírgula entre aspas", () => {
    const csv = arrayToCsv([{ nome: "Silva, João" }]);
    expect(csv.split("\n")[1]).toBe('"Silva, João"');
  });

  it("escapa aspas duplicando-as", () => {
    const csv = arrayToCsv([{ nota: 'Ele disse "oi"' }]);
    expect(csv.split("\n")[1]).toBe('"Ele disse ""oi"""');
  });

  it("trata valores nulos/indefinidos como campo vazio", () => {
    const csv = arrayToCsv([{ nome: "João", observacao: null }]);
    expect(csv.split("\n")[1]).toBe("João,");
  });

  it("retorna string vazia para lista vazia", () => {
    expect(arrayToCsv([])).toBe("");
  });
});
