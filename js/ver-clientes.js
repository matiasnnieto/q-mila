
document.addEventListener('DOMContentLoaded',()=>{
  const { createClient } = supabase;
  const sb = createClient('https://idpkigrqxdiadoflaieh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcGtpZ3JxeGRpYWRvZmxhaWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDY4MTAsImV4cCI6MjA3NjIyMjgxMH0.8mN8hFkBnOHSoGxE0-ht3RCKBMJIR5Uj-DqaW3MJj8Y');

  const alerta = document.getElementById('alertaClientes');

  function showOk(msg){ alerta.textContent=msg; alerta.className='alerta success'; alerta.style.opacity='1'; setTimeout(()=> alerta.style.opacity='0',3000); }
  function showErr(msg){ alerta.textContent=msg; alerta.className='alerta error'; alerta.style.opacity='1'; setTimeout(()=> alerta.style.opacity='0',3000); }

  async function load(){
    const { data, error } = await sb.from('clients').select('*').order('id',{ascending:false});
    if(error){ console.error(error); return; }
    render(data);
    window._clientes = data; // cache para filtro
  }

  function render(rows){
    const tb = document.querySelector('#tablaClientes tbody');
    tb.innerHTML='';
    rows.forEach(c=>{
      const tr = document.createElement('tr');
      tr.dataset.id = c.id;
      tr.innerHTML = `
        <td>${c.nombre||''}</td>
        <td>${c.apellido||''}</td>
        <td class="editable" data-field="direccion">${c.direccion||''}</td>
        <td class="editable" data-field="ciudad">${c.ciudad||''}</td>
        <td class="editable" data-field="telefono">${c.telefono||''}</td>`;
      tb.appendChild(tr);
    });
    bindInlineEdit();
  }

  function bindInlineEdit(){
    document.querySelectorAll('#tablaClientes td.editable').forEach(td=>{
      td.addEventListener('click', ()=>{
        if(td.querySelector('input')) return;
        const current = td.textContent;
        const input = document.createElement('input');
        input.type='text'; input.value=current; input.className='editing';
        td.textContent=''; td.appendChild(input); input.focus();
        const save = async ()=>{
          const nuevo = input.value.trim();
          const id = td.parentElement.dataset.id;
          const field = td.dataset.field;
          td.textContent = nuevo;
          const update = {}; update[field]=nuevo;
          const { error } = await sb.from('clients').update(update).eq('id', id);
          if(error){ showErr('❌ Error al actualizar cliente'); console.error(error); }
          else{ showOk('✅ Cliente actualizado correctamente'); }
        };
        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ input.blur(); }});
      });
    });
  }

  // Filtro en tiempo real
  const search = document.getElementById('buscarClientes');
  search.addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase();
    const data = (window._clientes||[]).filter(c=>{
      const txt = `${c.nombre||''} ${c.apellido||''} ${c.direccion||''} ${c.ciudad||''} ${c.telefono||''}`.toLowerCase();
      return txt.includes(q);
    });
    render(data);
  });

  load();
});
