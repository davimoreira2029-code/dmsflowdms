const fs = require('fs');
const path = 'src/app/api/tasks/[id]/route.ts';
let c = fs.readFileSync(path, 'utf8');

// Encontrar onde começa a primeira duplicata e remover tudo depois
const firstDelete = c.indexOf('\nexport async function DELETE');
const secondDelete = c.indexOf('\nexport async function DELETE', firstDelete + 1);

if (secondDelete !== -1) {
  c = c.substring(0, secondDelete);
  fs.writeFileSync(path, c);
  console.log('Duplicatas removidas! Tamanho:', c.length);
} else {
  console.log('Nenhuma duplicata encontrada');
}