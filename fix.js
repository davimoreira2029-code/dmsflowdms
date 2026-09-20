const fs = require('fs');
const path = 'src/app/api/tasks/[id]/route.ts';
let c = fs.readFileSync(path, 'utf8');

// Adicionar import do requireRole
c = c.replace(
  'import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";',
  'import { requireRole, UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";'
);

// Substituir requirePermission por requireRole nas funções DELETE e PUT que adicionamos
const parts = c.split('export async function DELETE');
if (parts.length > 1) {
  parts[1] = parts[1].replace(/await requirePermission\("MANAGE_TASKS"\);/g, 'await requireRole("ADMIN_EMPRESA", "SUPER_ADMIN");');
}
c = parts.join('export async function DELETE');

const parts2 = c.split('export async function PUT');
if (parts2.length > 1) {
  parts2[1] = parts2[1].replace(/await requirePermission\("MANAGE_TASKS"\);/g, 'await requireRole("ADMIN_EMPRESA", "SUPER_ADMIN");');
}
c = parts2.join('export async function PUT');

fs.writeFileSync(path, c);
console.log('OK');