const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/urnas/page.tsx', 'utf8');
c = c.replace('import { NewUrnForm }', 'import UrnActions from "./UrnActions";\nimport { NewUrnForm }');
c = c.replace(
  '<td className="px-4 py-3">\n                    {u.abaixoDoMinimo && <Badge tone="rejected">Abaixo do m',
  '<td className="px-4 py-3"><UrnActions urna={u} /></td>\n                  <td className="px-4 py-3">\n                    {u.abaixoDoMinimo && <Badge tone="rejected">Abaixo do m'
);
fs.writeFileSync('src/app/(app)/urnas/page.tsx', c);
console.log('OK', c.includes('UrnActions'));