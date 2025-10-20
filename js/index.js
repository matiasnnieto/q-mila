document.addEventListener('DOMContentLoaded',()=>{
  const { createClient } = supabase;
  const sb = createClient('https://idpkigrqxdiadoflaieh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcGtpZ3JxeGRpYWRvZmxhaWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDY4MTAsImV4cCI6MjA3NjIyMjgxMH0.8mN8hFkBnOHSoGxE0-ht3RCKBMJIR5Uj-DqaW3MJj8Y');
  
async function verificarConexionSupabase(sb) {
  try {
    const { data, error } = await sb.from('clients').select('id').limit(1);
    const alerta = document.getElementById('alerta');
    if (error) throw error;
    alerta.textContent = '✅ Conexión con Supabase establecida';
    alerta.className = 'alerta success';
    setTimeout(()=> alerta.style.opacity='0', 3000);
  } catch (err) {
    const alerta = document.getElementById('alerta');
    alerta.textContent = '❌ Error al conectar con Supabase';
    alerta.className = 'alerta error';
  }
}

  verificarConexionSupabase(sb);
});
