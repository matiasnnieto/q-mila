
document.addEventListener('DOMContentLoaded',()=>{
  const { createClient } = supabase;
  const sb = createClient('https://idpkigrqxdiadoflaieh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcGtpZ3JxeGRpYWRvZmxhaWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDY4MTAsImV4cCI6MjA3NjIyMjgxMH0.8mN8hFkBnOHSoGxE0-ht3RCKBMJIR5Uj-DqaW3MJj8Y');

  // Build hour options 07:00 .. 22:00 step 15'
  const horaSel = document.getElementById('horaEntrega');
  const placeholder = document.createElement('option');
  placeholder.value=''; placeholder.textContent='Seleccionar hora...'; placeholder.disabled=true; placeholder.selected=true;
  horaSel.appendChild(placeholder);
  for(let h=7; h<=22; h++){
    for(let m=0; m<60; m+=15){
      if(h===22 && m>0) break;
      const hh=String(h).padStart(2,'0'); const mm=String(m).padStart(2,'0');
      const opt=document.createElement('option'); opt.value=`${hh}:${mm}`; opt.textContent=`${hh}:${mm}`; horaSel.appendChild(opt);
    }
  }

  const alerta=document.getElementById('alertaForm');
  const form=document.getElementById('clienteForm');
  const nombreInput=document.getElementById('nombre');
  const apellidoInput=document.getElementById('apellido');
  const direccionInput=document.getElementById('direccion');
  const ciudadInput=document.getElementById('ciudad');
  const telefonoInput=document.getElementById('telefono');
  const sugerenciasBox=document.getElementById('sugerencias');
  const limpiarBtn=document.getElementById('limpiarBtn');

  let clienteExistenteId = null;

  function showAlertOk(msg){
    alerta.textContent = msg; alerta.className='alerta success';
    alerta.style.opacity='1'; setTimeout(()=> alerta.style.opacity='0', 3000);
  }
  function showAlertErr(msg){
    alerta.textContent = msg; alerta.className='alerta error';
    alerta.style.opacity='1'; setTimeout(()=> alerta.style.opacity='0', 3000);
  }

  async function buscarSugerencias(q){
    // Busca por nombre o apellido con ilike
    const { data, error } = await sb
      .from('clients')
      .select('id,nombre,apellido,ciudad,direccion,telefono')
      .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`)
      .limit(10);
    if(error){ console.error(error); return []; }
    return data || [];
  }

  function renderSugerencias(items){
    sugerenciasBox.innerHTML = '';
    if(!items.length){ sugerenciasBox.style.display='none'; return; }
    items.forEach(c=>{
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.textContent = `${c.nombre} ${c.apellido} — ${c.ciudad||''}`;
      div.onclick = ()=>{
        clienteExistenteId = c.id;
        nombreInput.value = c.nombre;
        apellidoInput.value = c.apellido||'';
        direccionInput.value = c.direccion||'';
        ciudadInput.value = c.ciudad||'';
        telefonoInput.value = c.telefono||'';
        sugerenciasBox.style.display='none';
        nombreInput.setAttribute('disabled','disabled');
        limpiarBtn.style.display='inline-block';
        showAlertOk('✅ Cliente cargado automáticamente');
      };
      sugerenciasBox.appendChild(div);
    });
    sugerenciasBox.style.display = 'block';
  }

  let typingTimer;
  nombreInput.addEventListener('input', (e)=>{
    const q = e.target.value.trim();
    if(q.length < 3){ sugerenciasBox.style.display='none'; return; }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(async ()=>{
      const items = await buscarSugerencias(q);
      renderSugerencias(items);
    }, 250);
  });

  // Permitir activar búsqueda también desde apellido si nombre está vacío
  apellidoInput.addEventListener('input', async (e)=>{
    const q = e.target.value.trim();
    if(nombreInput.value.trim().length>=3) return; // prioridad nombre
    if(q.length < 3){ sugerenciasBox.style.display='none'; return; }
    const items = await buscarSugerencias(q);
    renderSugerencias(items);
  });

  // Limpiar formulario
  limpiarBtn.onclick = ()=>{
    clienteExistenteId = null;
    form.reset();
    nombreInput.removeAttribute('disabled');
    sugerenciasBox.style.display='none';
    limpiarBtn.style.display='none';
    // reset hour placeholder
    horaSel.selectedIndex = 0;
  };

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fecha=document.getElementById('fechaEntrega').value;
    const hora=horaSel.value;
    if(!fecha || !hora){ showAlertErr('❌ Completá la fecha y la hora'); return; }
    const fechaPactada = `${fecha}T${hora}:00`;

    let clienteId = clienteExistenteId;
    if(!clienteId){
      // crear cliente nuevo
      const { data: cli, error: cliErr } = await sb.from('clients').insert([{
        nombre: nombreInput.value.trim(),
        apellido: apellidoInput.value.trim(),
        direccion: direccionInput.value.trim(),
        ciudad: ciudadInput.value.trim(),
        telefono: telefonoInput.value.trim()
      }]).select();
      if(cliErr || !cli || !cli.length){ showAlertErr('❌ Error al guardar cliente'); return; }
      clienteId = cli[0].id;
    }

    // Insert orders for products with kg > 0
    const inputs = document.querySelectorAll('.kg');
    let inserted = 0;
    for(const input of inputs){
      const kg = parseFloat(input.value) || 0;
      if(kg <= 0) continue;
      const producto = input.dataset.producto;
      const { error: pedErr } = await sb.from('pedidos').insert([{
        cliente_id: clienteId,
        descripcion: `Pedido de ${producto}`,
        producto,
        cantidad_kg: kg,
        estado: 'Recibido',
        fecha_entrega_pactada: fechaPactada,
        fecha_carga: new Date().toISOString()
      }]);
      if(!pedErr) inserted++;
      if(pedErr) console.error(pedErr);
    }

    if(inserted>0){
      showAlertOk('✅ Pedido guardado correctamente');
      form.reset();
      nombreInput.removeAttribute('disabled');
      limpiarBtn.style.display='none';
      sugerenciasBox.style.display='none';
      horaSel.selectedIndex = 0;
      clienteExistenteId = null;
    }else{
      showAlertErr('❌ Ingresá al menos un producto con kg');
    }
  });
});
