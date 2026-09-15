const fs = require('fs');
const path = 'src/app/api/tasks/[id]/route.ts';
let c = fs.readFileSync(path, 'utf8');
const extra = `
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.companyId) return NextResponse.json({ success: false }, { status: 401 });
  try {
    await prisma.task.delete({ where: { id: params.id, companyId: session.user.companyId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.companyId) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const body = await req.json();
    const task = await prisma.task.update({ where: { id: params.id, companyId: session.user.companyId }, data: { titulo: body.titulo, descricao: body.descricao, prioridade: body.prioridade, status: body.status } });
    return NextResponse.json({ success: true, data: task });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
`;
c = c + extra;
fs.writeFileSync(path, c);
console.log('OK');