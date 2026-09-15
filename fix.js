const fs = require('fs');
const path = 'src/app/api/tasks/[id]/route.ts';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/requirePermission\("WRITE"\)/g, 'requirePermission("MANAGE_TASKS")');
fs.writeFileSync(path, c);
console.log('OK');