const fs = require('fs');
const path = 'src/app/api/tasks/[id]/route.ts';
let c = fs.readFileSync(path, 'utf8');

// Remover o DELETE e PUT que adicionamos (com auth e prisma)
const firstDelete = c.indexOf('\nexport async function DELETE');
if (firstDelete !== -1) {
  c = c.substring(0, firstDelete);
}

// Adicionar DELETE e PUT corretos
const extra = `
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("WRITE");
    const { prisma } = await import("@/server/db");
    await prisma.task.delete({ where: { id: params.id, companyId } });
    return NextResponse.json({ success: true, data: null, error: null, message: "Tarefa excluida." });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ success: false, data: null, error: "UNAUTHORIZED", message: (err as Error).message }, { status: 401 });
    if (err instanceof NoCompanyContextError || err instanceof ForbiddenError) return NextResponse.json({ success: false, data: null, error: "FORBIDDEN", message: (err as Error).message }, { status: 403 });
    return NextResponse.json({ success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao excluir." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("WRITE");
    const { prisma } = await import("@/server/db");
    const body = await req.json();
    const task = await prisma.task.update({ where: { id: params.id, companyId }, data: { titulo: body.titulo, descricao: body.descricao, prioridade: body.prioridade, status: body.status } });
    return NextResponse.json({ success: true, data: task, error: null, message: null });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ success: false, data: null, error: "UNAUTHORIZED", message: (err as Error).message }, { status: 401 });
    if (err instanceof NoCompanyContextError || err instanceof ForbiddenError) return NextResponse.json({ success: false, data: null, error: "FORBIDDEN", message: (err as Error).message }, { status: 403 });
    return NextResponse.json({ success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao atualizar." }, { status: 500 });
  }
}
`;

c = c + extra;
fs.writeFileSync(path, c);
console.log('OK, tamanho:', c.length);