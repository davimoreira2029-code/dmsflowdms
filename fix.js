const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/tarefas/page.tsx', 'utf8');
c = 'import TarefaActions from "./TarefaActions";\n' + c;
c = c.replace(
  '</div>\n            </Link>',
  '<TarefaActions tarefa={t} /></div>\n            </Link>'
);
fs.writeFileSync('src/app/(app)/tarefas/page.tsx', c);
console.log('OK', c.includes('TarefaActions'));