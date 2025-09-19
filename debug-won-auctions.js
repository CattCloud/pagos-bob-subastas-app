/**
 * Script de debugging para verificar el endpoint /users/:id/won-auctions
 * Ejecutar con: node debug-won-auctions.js
 */

const API_BASE = 'http://localhost:3000';

async function req(endpoint, opts = {}) {
  const url = `${API_BASE}${endpoint}`;
  const { method = 'GET', headers = {}, body } = opts;
  const finalHeaders = { ...headers };
  if (body && !finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { 
    data = await res.json(); 
  } catch (e) {
    console.log('No se pudo parsear JSON:', e.message);
  }
  
  console.log(`\n${method} ${endpoint}`);
  console.log(`Status: ${res.status} ${res.statusText}`);
  console.log('Response:', JSON.stringify(data, null, 2));
  
  return { res, data };
}

async function debug() {
  console.log('🔍 Debugging subastas ganadas para cliente DNI 12345678');

  // 1. Login cliente
  console.log('\n=== 1. LOGIN CLIENTE ===');
  const { res: loginRes, data: loginData } = await req('/auth/client-login', {
    method: 'POST',
    body: { document_type: 'DNI', document_number: '12345678' }
  });

  if (!loginRes.ok) {
    console.error('❌ Login falló');
    return;
  }

  const sessionId = loginData.data.session.session_id;
  const userId = loginData.data.user.id;
  const headers = { 'X-Session-ID': sessionId };

  console.log(`✅ Login exitoso. User ID: ${userId}`);

  // 2. Verificar subastas ganadas
  console.log('\n=== 2. VERIFICAR SUBASTAS GANADAS ===');
  const { res: wonRes, data: wonData } = await req(`/users/${userId}/won-auctions`, { headers });

  console.log('Estructura completa de respuesta:', JSON.stringify(wonData, null, 2));

  if (wonRes.ok) {
    // Analizar estructura según lo que esperamos en auctionService.js
    const auctions = wonData?.data?.auctions || wonData?.data?.wonAuctions || wonData?.data || [];
    console.log(`📊 Subastas encontradas: ${Array.isArray(auctions) ? auctions.length : 'No es array'}`);
    
    if (Array.isArray(auctions) && auctions.length > 0) {
      auctions.forEach((auction, idx) => {
        console.log(`\n--- Subasta ${idx + 1} ---`);
        console.log(`ID: ${auction.id}`);
        console.log(`Estado: ${auction.estado}`);
        console.log(`Marca/Modelo: ${auction.asset?.marca} ${auction.asset?.modelo}`);
        console.log(`Placa: ${auction.asset?.placa}`);
        console.log(`Oferta: ${auction.monto_oferta || auction.offer_amount}`);
        console.log(`Garantía: ${auction.monto_garantia || 'No calculada'}`);
        console.log(`Fecha límite pago: ${auction.fecha_limite_pago}`);
      });
    } else {
      console.log('❌ No se encontraron subastas o estructura incorrecta');
    }
  } else {
    console.log('❌ Error al obtener subastas ganadas');
  }

  // 3. Verificar todas las subastas (admin view)
  console.log('\n=== 3. VERIFICAR TODAS LAS SUBASTAS (ADMIN) ===');
  const { res: adminLoginRes, data: adminLoginData } = await req('/auth/admin-access', { method: 'POST' });
  
  if (adminLoginRes.ok) {
    const adminHeaders = { 'X-Session-ID': adminLoginData.data.session.session_id };
    const { res: allAuctionsRes, data: allAuctionsData } = await req('/auctions', { headers: adminHeaders });
    
    if (allAuctionsRes.ok) {
      const allAuctions = allAuctionsData?.data?.auctions || allAuctionsData?.data || [];
      console.log(`📊 Total subastas en sistema: ${Array.isArray(allAuctions) ? allAuctions.length : 'No es array'}`);
      
      if (Array.isArray(allAuctions)) {
        allAuctions.forEach((auction, idx) => {
          console.log(`\n--- Subasta ${idx + 1} (Sistema) ---`);
          console.log(`ID: ${auction.id}`);
          console.log(`Estado: ${auction.estado}`);
          console.log(`Marca/Modelo: ${auction.asset?.marca} ${auction.asset?.modelo}`);
          console.log(`Placa: ${auction.asset?.placa}`);
          console.log(`Ganador ID: ${auction.id_offerWin || auction.winner_id || 'Sin ganador'}`);
          console.log(`Ofertas: ${auction.offers?.length || 'No info'}`);
        });
      }
    }
  }

  // 4. Verificar endpoint con usuario específico para comparar
  console.log('\n=== 4. COMPARACIÓN CON ENDPOINT GENERAL ===');
  const { res: userMovRes, data: userMovData } = await req(`/users/${userId}/movements`, { headers });
  
  if (userMovRes.ok) {
    const movements = userMovData?.data?.movements || userMovData?.data || [];
    console.log(`📊 Movimientos del usuario: ${Array.isArray(movements) ? movements.length : 'No es array'}`);
  }
}

debug().catch(console.error);