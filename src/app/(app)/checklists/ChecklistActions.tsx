<div style={{marginBottom:"16px"}}>
  <label style={{fontSize:"11px",fontWeight:"500",color:"#666",textTransform:"uppercase"}}>Itens</label>

  <div style={{marginTop:"8px",display:"flex",flexDirection:"column",gap:"8px"}}>
    {items.map((item, idx) => (
      <div key={item.id} style={{display:"flex",gap:"8px",alignItems:"center"}}>

        <input
          style={{
            flex:1,
            border:"1px solid #ddd",
            borderRadius:"4px",
            padding:"6px 10px",
            fontSize:"13px"
          }}
          value={item.descricao}
          onChange={e => {
            const arr=[...items];
            const it=arr[idx];
            if(it) {
              it.descricao=e.target.value;
            }
            setItems(arr);
          }}
        />

        <label style={{
          fontSize:"12px",
          color:"#666",
          display:"flex",
          alignItems:"center",
          gap:"4px",
          whiteSpace:"nowrap"
        }}>
          <input
            type="checkbox"
            checked={item.obrigatorio}
            onChange={e => {
              const arr=[...items];
              const it=arr[idx];
              if(it) {
                it.obrigatorio=e.target.checked;
              }
              setItems(arr);
            }}
          />
          Obrig.
        </label>

        <button
          onClick={() => setItems(items.filter((_,i) => i!==idx))}
          style={{
            color:"#ef4444",
            fontSize:"14px",
            cursor:"pointer",
            border:"none",
            background:"none"
          }}
        >
          ✕
        </button>

      </div>
    ))}

    <button
      onClick={() => setItems([
        ...items,
        {
          id: Date.now().toString(),
          descricao: "",
          obrigatorio: false
        }
      ])}
      style={{
        fontSize:"12px",
        color:"#0D1B2A",
        textDecoration:"underline",
        cursor:"pointer",
        border:"none",
        background:"none",
        textAlign:"left"
      }}
    >
      + Adicionar item
    </button>
  </div>
</div>