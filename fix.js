const fs = require('fs');
const path = 'src/app/api/tasks/[id]/route.ts';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/await requirePermission\("MANAGE_TASKS"\);/g, 'await requireRole("ADMIN_EMPRESA", "SUPER_ADMIN");');
c = c.replace('import { requirePermission, UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";', 'import { requireRole, UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";');
fs.writeFileSync(path, c);
console.log('OK');