Encontre a linha:

const arr=[...items]; arr[idx].descricao=e.target.value; setItems(arr);

Substitua por:

const arr=[...items]; const it=arr[idx]; if(it) { it.descricao=e.target.value; } setItems(arr);

E encontre:

const arr=[...items]; arr[idx].obrigatorio=e.target.checked; setItems(arr);

Substitua por:

const arr=[...items]; const it=arr[idx]; if(it) { it.obrigatorio=e.target.checked; } setItems(arr);