import { prisma } from "@/server/db";
import {
  calculateNewQuantity,
  isBelowMinimum,
  crossedBelowMinimumThreshold,
  type InventoryMovementType,
} from "@/server/services/inventory-rules";
import { notifyCompanyAdmins } from "@/server/services/notification.service";

export class ProductNotFoundError extends Error {
  constructor() {
    super("Produto não encontrado.");
  }
}

export interface CreateProductInput {
  nome: string;
  categoria: "URNAS" | "MATERIAIS" | "EPIS" | "PRODUTOS_LABORATORIAIS" | "ORNAMENTACAO" | "LIMPEZA" | "OUTROS";
  codigo?: string;
  unidade?: string;
  quantidade?: number;
  estoqueMinimo?: number;
}

export async function listProducts(companyId: string) {
  const products = await prisma.inventoryProduct.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { nome: "asc" },
  });

  // isBelowMinimum é calculado aqui (não fica gravado no banco) para
  // nunca dessincronizar do valor real de quantidade/estoqueMinimo.
  return products.map((p) => ({ ...p, abaixoDoMinimo: isBelowMinimum(p.quantidade, p.estoqueMinimo) }));
}

export async function getProductDetail(id: string, companyId: string) {
  const product = await prisma.inventoryProduct.findFirst({
    where: { id, companyId },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!product) return null;

  return { ...product, abaixoDoMinimo: isBelowMinimum(product.quantidade, product.estoqueMinimo) };
}

export async function createProduct(companyId: string, input: CreateProductInput) {
  return prisma.inventoryProduct.create({
    data: { companyId, ...input },
  });
}

export interface CreateMovementInput {
  tipo: InventoryMovementType;
  quantidade: number;
  motivo?: string;
}

/**
 * Registra uma movimentação e atualiza a quantidade do produto na
 * mesma transação — nunca deixa os dois dessincronizados.
 */
export async function createInventoryMovement(
  productId: string,
  companyId: string,
  userId: string,
  input: CreateMovementInput,
) {
  const product = await prisma.inventoryProduct.findFirst({ where: { id: productId, companyId } });
  if (!product) throw new ProductNotFoundError();

  // Pode lançar NegativeStockError — deixa propagar para a rota tratar.
  const newQuantity = calculateNewQuantity(product.quantidade, input.tipo, input.quantidade);

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: { productId, companyId, userId, tipo: input.tipo, quantidade: input.quantidade, motivo: input.motivo },
    }),
    prisma.inventoryProduct.update({ where: { id: productId }, data: { quantidade: newQuantity } }),
  ]);

  // Item 21: alerta ESTOQUE_BAIXO — só dispara na transição para abaixo
  // do mínimo, não a cada movimentação (evita spam de notificação
  // repetida enquanto o produto continua abaixo do mínimo).
  if (crossedBelowMinimumThreshold(product.quantidade, newQuantity, product.estoqueMinimo)) {
    await notifyCompanyAdmins(
      companyId,
      "ESTOQUE_BAIXO",
      "Estoque abaixo do mínimo",
      `${product.nome} — ${newQuantity} ${product.unidade ?? "un"} restantes (mínimo: ${product.estoqueMinimo})`,
    );
  }

  return movement;
}

/** Item 22: lista para o alerta de "estoque abaixo do mínimo". */
export async function listBelowMinimumProducts(companyId: string) {
  const products = await prisma.inventoryProduct.findMany({
    where: { companyId, deletedAt: null, ativo: true },
  });
  return products.filter((p) => isBelowMinimum(p.quantidade, p.estoqueMinimo));
}
