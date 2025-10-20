
document.addEventListener('DOMContentLoaded',()=>{
  const { createClient } = supabase;
  const sb = createClient('https://idpkigrqxdiadoflaieh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcGtpZ3JxeGRpYWRvZmxhaWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDY4MTAsImV4cCI6MjA3NjIyMjgxMH0.8mN8hFkBnOHSoGxE0-ht3RCKBMJIR5Uj-DqaW3MJj8Y');

  const alerta = document.getElementById('alertaPedidos');
  function showOk(msg){ alerta.textContent=msg; alerta.className='alerta success'; alerta.style.opacity='1'; setTimeout(()=> alerta.style.opacity='0',3000); }
  function showErr(msg){ alerta.textContent=msg; alerta.className='alerta error'; alerta.style.opacity='1'; setTimeout(()=> alerta.style.opacity='0',3000); }

  function estadoSelectHtml(actual, disabled){
    const estados = ['Recibido','En preparación','Listo para entregar','Entregado'];
    return `<select class="estadoSel" ${disabled?'disabled':''}>
      ${estados.map(e=>`<option value="${e}" ${e===actual?'selected':''}>${e}</option>`).join('')}
    </select>`;
  }

  async function load(){
    const { data, error } = await sb
      .from('pedidos')
      .select('id, producto, cantidad_kg, estado, fecha_entrega_pactada, fecha_entregado, cliente_id, clients (id, nombre, apellido, direccion, ciudad, telefono)')
      .order('id', { ascending: false });
    if(error){ console.error(error); return; }
    window._pedidos = data || [];
    render(window._pedidos);
  }

  function render(rows){
    const tb = document.querySelector('#tablaPedidos tbody');
    tb.innerHTML='';
    rows.forEach(p=>{
      const tr = document.createElement('tr');
      const clienteTxt = p.clients ? `${p.clients.nombre} ${p.clients.apellido}` : '';
      const direccion = p.clients?.direccion || '';
      const ciudad = p.clients?.ciudad || '';
      const tel = p.clients?.telefono || '';
      const fechaPactada = p.fecha_entrega_pactada ? new Date(p.fecha_entrega_pactada).toLocaleString() : '';
      const fechaEntregado = p.fecha_entregado ? new Date(p.fecha_entregado).toLocaleString() : '';
      const disabled = p.estado === 'Entregado';
      tr.innerHTML = `
        <td><strong>${clienteTxt}</strong></td>
        <td>${direccion}</td>
        <td>${ciudad}</td>
        <td>${tel}</td>
        <td>${p.producto||''}</td>
        <td>${p.cantidad_kg ?? ''}</td>
        <td data-id="${p.id}">${estadoSelectHtml(p.estado||'Recibido', disabled)}</td>
        <td>${fechaPactada}</td>
        <td>${fechaEntregado}</td>`;
      tb.appendChild(tr);
    });

    // Bind cambios de estado (solo si no está entregado)
    document.querySelectorAll('.estadoSel').forEach(sel=>{
      sel.addEventListener('change', async (e)=>{
        const td = e.target.closest('td');
        const id = td.dataset.id;
        const nuevo = e.target.value;
        const update = { estado: nuevo };
        if(nuevo === 'Entregado'){ update.fecha_entregado = new Date().toISOString(); }
        const { error: upErr } = await sb.from('pedidos').update(update).eq('id', id);
        if(upErr){ console.error(upErr); showErr('❌ Error al actualizar estado'); }
        else {
          if(nuevo === 'Entregado'){ e.target.setAttribute('disabled','disabled'); }
          showOk('✅ Estado actualizado correctamente');
        }
      });
    });
  }

  // Filtro en tiempo real
  const search = document.getElementById('buscarPedidos');
  search.addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase();
    const rows = (window._pedidos||[]).filter(p=>{
      const cliente = p.clients ? `${p.clients.nombre} ${p.clients.apellido}` : '';
      const txt = `${cliente} ${p.producto||''} ${p.estado||''} ${p.clients?.ciudad||''} ${p.clients?.telefono||''}`.toLowerCase();
      return txt.includes(q);
    });
    render(rows);
  });

  load();
});
