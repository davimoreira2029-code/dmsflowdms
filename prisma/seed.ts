import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureModuleCatalog, grantAllModules } from "../src/server/services/module.service";
import { seedDefaultPlans } from "../src/server/services/billing.service";

const prisma = new PrismaClient();

/**
 * Seed de DESENVOLVIMENTO apenas (item 44 do comando original).
 * Nunca usar dados reais aqui. Roda em duas etapas independentes:
 *   1. bootstrapSuperAdmin() — sempre necessário, mesmo em produção
 *      inicial, para existir um SUPER_ADMIN no primeiro deploy.
 *   2. seedDemoCompany() — dados fictícios de demonstração, só faz
 *      sentido em ambiente de desenvolvimento/staging.
 */

async function bootstrapSuperAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminInitialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!adminEmail || !adminInitialPassword) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_INITIAL_PASSWORD no .env antes de rodar o seed.");
  }

  const passwordHash = await bcrypt.hash(adminInitialPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Davi Moreira",
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      mustChangePassword: true,
    },
  });

  console.log(`✔ Super Admin pronto: ${admin.email} (troque a senha no primeiro login)`);
}

async function seedDemoCompany() {
  console.log("── Criando dados de DEMONSTRAÇÃO (Funerária Demo) — não são dados reais ──");

  const demoPasswordHash = await bcrypt.hash("Demo@12345", 12);

  const company = await prisma.company.upsert({
    where: { cnpj: "00.000.000/0001-00" },
    update: {},
    create: {
      razaoSocial: "Funerária Demo LTDA",
      nomeFantasia: "Funerária Demo",
      cnpj: "00.000.000/0001-00",
      email: "contato@funerariademo.com.br",
      telefone: "(33) 3000-0000",
      cidade: "Manhuaçu",
      estado: "MG",
      status: "TRIAL",
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const [admin, gerente, supervisor, op1, op2] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@funerariademo.com.br" },
      update: {},
      create: {
        companyId: company.id,
        name: "Ana Administradora",
        email: "admin@funerariademo.com.br",
        passwordHash: demoPasswordHash,
        role: "ADMIN_EMPRESA",
      },
    }),
    prisma.user.upsert({
      where: { email: "gerente@funerariademo.com.br" },
      update: {},
      create: {
        companyId: company.id,
        name: "Gustavo Gerente",
        email: "gerente@funerariademo.com.br",
        passwordHash: demoPasswordHash,
        role: "GERENTE",
      },
    }),
    prisma.user.upsert({
      where: { email: "supervisor@funerariademo.com.br" },
      update: {},
      create: {
        companyId: company.id,
        name: "Sandra Supervisora",
        email: "supervisor@funerariademo.com.br",
        passwordHash: demoPasswordHash,
        role: "SUPERVISOR",
      },
    }),
    prisma.user.upsert({
      where: { email: "operacional1@funerariademo.com.br" },
      update: {},
      create: {
        companyId: company.id,
        name: "Otávio Operacional",
        email: "operacional1@funerariademo.com.br",
        passwordHash: demoPasswordHash,
        role: "OPERACIONAL",
      },
    }),
    prisma.user.upsert({
      where: { email: "operacional2@funerariademo.com.br" },
      update: {},
      create: {
        companyId: company.id,
        name: "Olívia Operacional",
        email: "operacional2@funerariademo.com.br",
        passwordHash: demoPasswordHash,
        role: "OPERACIONAL",
      },
    }),
  ]);

  // ── Veículos ──────────────────────────────────────────────────
  const placas = ["DEM0A01", "DEM0A02", "DEM0A03", "DEM0A04", "DEM0A05"];
  const vehicles = await Promise.all(
    placas.map((placa, i) =>
      prisma.vehicle.upsert({
        where: { companyId_placa: { companyId: company.id, placa } },
        update: {},
        create: {
          companyId: company.id,
          placa,
          marca: i % 2 === 0 ? "Fiat" : "Chevrolet",
          modelo: i % 2 === 0 ? "Doblò" : "Spin",
          ano: 2020 + (i % 4),
          kmAtual: 10000 + i * 3500,
          status: i === 4 ? "MANUTENCAO" : "DISPONIVEL",
        },
      }),
    ),
  );

  // ── Checklist templates (5, com itens) ───────────────────────
  const templateDefs = [
    { nome: "Checklist Veículo", categoria: "VEICULO", itens: ["Conferir combustível", "Conferir limpeza", "Conferir documentação", "Registrar KM"] },
    { nome: "Checklist Urna", categoria: "URNA", itens: ["Modelo conferido", "Tamanho conferido", "Ornamentação", "Acabamento"] },
    { nome: "Checklist Laboratório", categoria: "LABORATORIO", itens: ["Preparação autorizada", "Higienização", "Vestimenta", "Procedimento realizado"] },
    { nome: "Checklist Finalização", categoria: "FINALIZACAO", itens: ["Capela organizada", "Materiais recolhidos", "Serviço conferido", "Responsável confirmou"] },
    { nome: "Checklist Documentação", categoria: "DOCUMENTACAO", itens: ["Certidão conferida", "Autorização assinada", "Cópia arquivada"] },
  ];

  const templates = [];
  for (const def of templateDefs) {
    const template = await prisma.checklistTemplate.create({
      data: {
        companyId: company.id,
        nome: def.nome,
        categoria: def.categoria,
        items: {
          create: def.itens.map((descricao, ordem) => ({ descricao, ordem, obrigatorio: true })),
        },
      },
    });
    templates.push(template);
  }

  // ── Produtos de estoque ───────────────────────────────────────
  const products = await Promise.all(
    [
      { nome: "Luva de procedimento (caixa)", categoria: "EPIS" as const, quantidade: 40, estoqueMinimo: 10 },
      { nome: "Álcool 70% (litro)", categoria: "PRODUTOS_LABORATORIAIS" as const, quantidade: 15, estoqueMinimo: 5 },
      { nome: "Arranjo de flores padrão", categoria: "ORNAMENTACAO" as const, quantidade: 8, estoqueMinimo: 3 },
      { nome: "Kit limpeza pós-serviço", categoria: "LIMPEZA" as const, quantidade: 2, estoqueMinimo: 5 },
      { nome: "Vela decorativa", categoria: "OUTROS" as const, quantidade: 25, estoqueMinimo: 10 },
    ].map((p) =>
      prisma.inventoryProduct.create({
        data: { companyId: company.id, ...p, unidade: "un" },
      }),
    ),
  );

  // ── Urnas ─────────────────────────────────────────────────────
  const urns = await Promise.all(
    [
      { modelo: "Standard", material: "Madeira", quantidade: 6, estoqueMinimo: 2 },
      { modelo: "Premium", material: "Madeira nobre", quantidade: 2, estoqueMinimo: 1 },
      { modelo: "Infantil", material: "Madeira", quantidade: 3, estoqueMinimo: 1 },
    ].map((u) => prisma.urn.create({ data: { companyId: company.id, ...u } })),
  );

  // ── 20 serviços ───────────────────────────────────────────────
  const statuses = ["NOVO", "EM_PREPARACAO", "EM_ANDAMENTO", "AGUARDANDO", "FINALIZADO", "ARQUIVADO"] as const;
  const responsaveis = [gerente, supervisor, op1, op2];
  for (let i = 0; i < 20; i++) {
    const status = statuses[i % statuses.length];
    await prisma.service.create({
      data: {
        companyId: company.id,
        status,
        tipo: i % 3 === 0 ? "Sepultamento" : i % 3 === 1 ? "Cremação" : "Translado",
        data: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        hora: "09:00",
        falecidoNome: `Registro Demo ${i + 1}`,
        responsavelId: responsaveis[i % responsaveis.length].id,
        veiculoId: vehicles[i % vehicles.length].id,
        urnaId: urns[i % urns.length].id,
        local: "Capela Municipal",
        events: {
          create: [{ companyId: company.id, tipo: "SERVICO_CRIADO", userId: admin.id }],
        },
      },
    });
  }

  // ── 10 tarefas ────────────────────────────────────────────────
  const priorities = ["BAIXA", "NORMAL", "ALTA", "URGENTE"] as const;
  const taskStatuses = ["A_FAZER", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"] as const;
  for (let i = 0; i < 10; i++) {
    await prisma.task.create({
      data: {
        companyId: company.id,
        titulo: `Tarefa demo ${i + 1}`,
        descricao: "Tarefa de demonstração gerada pelo seed.",
        responsavelId: responsaveis[i % responsaveis.length].id,
        criadorId: admin.id,
        prioridade: priorities[i % priorities.length],
        status: taskStatuses[i % taskStatuses.length],
        prazo: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ── Notificações ──────────────────────────────────────────────
  const notifTypes: Array<{ tipo: string; titulo: string }> = [
    { tipo: "NOVA_TAREFA", titulo: "Nova tarefa atribuída" },
    { tipo: "SERVICO_FINALIZADO", titulo: "Serviço finalizado" },
    { tipo: "ESTOQUE_BAIXO", titulo: "Estoque abaixo do mínimo" },
    { tipo: "CHECKLIST_PENDENTE", titulo: "Checklist pendente" },
    { tipo: "MANUTENCAO_VEICULO", titulo: "Manutenção de veículo próxima" },
  ];
  for (const [i, n] of notifTypes.entries()) {
    await prisma.notification.create({
      data: {
        companyId: company.id,
        userId: responsaveis[i % responsaveis.length].id,
        tipo: n.tipo,
        titulo: n.titulo,
        mensagem: "Notificação de demonstração gerada pelo seed.",
        lida: i % 2 === 0,
      },
    });
  }

  await grantAllModules(company.id);

  console.log(`✔ Empresa demo pronta: ${company.nomeFantasia}`);
  console.log(`  Login admin: admin@funerariademo.com.br / Demo@12345`);
  console.log(`  ${vehicles.length} veículos, ${templates.length} checklists, ${products.length} produtos, ${urns.length} urnas, 20 serviços, 10 tarefas, ${notifTypes.length} notificações.`);
}

async function main() {
  await ensureModuleCatalog();
  await seedDefaultPlans();
  await bootstrapSuperAdmin();

  if (process.env.NODE_ENV !== "production") {
    await seedDemoCompany();
  } else {
    console.log("NODE_ENV=production — pulando dados de demonstração.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
