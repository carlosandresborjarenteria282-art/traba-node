const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE = `http://localhost:${process.env.PORT || 3000}`;

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.log(`  ❌ ${msg}`);
  }
}

async function req(method, path, { body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  return { status: res.status, data };
}

async function main() {
  console.log('=== Smoke test ===');

  // 1. Health
  console.log('\n[1] Health check');
  const h = await req('GET', '/api/health');
  ok(h.status === 200, 'Health status 200');
  ok(h.data && h.data.ok === true, 'Health ok:true');
  ok(h.data && h.data.baseDatos === 'JSON', 'Health baseDatos JSON');

  // 2. Login incorrecto
  console.log('\n[2] Login incorrecto');
  const bad = await req('POST', '/api/auth/login', { body: { usuario: 'admin', contraseña: 'wrong' } });
  ok(bad.status === 401, 'Login incorrecto -> 401');

  // 3. Login correcto
  console.log('\n[3] Login correcto');
  const login = await req('POST', '/api/auth/login', { body: { usuario: 'admin', contraseña: process.env.ADMIN_PASSWORD || '123456' } });
  ok(login.status === 200, 'Login correcto -> 200');
  ok(login.data && login.data.token, 'Token recibido');
  const token = login.data.token;

  // 4. Listado
  console.log('\n[4] Listado');
  const list = await req('GET', '/api/productos');
  ok(list.status === 200, 'Listado -> 200');
  ok(Array.isArray(list.data.data), 'data es array');
  ok(typeof list.data.total === 'number', 'total es número');

  // 5. Búsqueda
  console.log('\n[5] Búsqueda');
  const search = await req('GET', '/api/productos?buscar=laptop');
  ok(search.status === 200, 'Búsqueda -> 200');
  ok(Array.isArray(search.data.data) && search.data.data.length >= 1, 'Búsqueda devuelve resultados');

  // 6. Estadísticas
  console.log('\n[6] Estadísticas');
  const stats = await req('GET', '/api/productos/estadisticas');
  ok(stats.status === 200, 'Estadísticas -> 200');
  ok(stats.data && stats.data.data && typeof stats.data.data.totalProductos === 'number', 'totalProductos numérico');

  // 7. 401 sin token
  console.log('\n[7] Crear sin token');
  const noToken = await req('POST', '/api/productos', { body: { nombre: 'X', precio: 10, stock: 1 } });
  ok(noToken.status === 401, 'Sin token -> 401');

  // 8. 401 token inválido
  console.log('\n[8] Token inválido');
  const badToken = await req('POST', '/api/productos', { body: { nombre: 'X', precio: 10, stock: 1 }, token: 'invalid.token.here' });
  ok(badToken.status === 401, 'Token inválido -> 401');

  // 9. 403 sin rol admin (token firmado con rol usuario)
  console.log('\n[9] 403 sin rol admin');
  const fakeToken = jwt.sign({ id: 999, usuario: 'tester', rol: 'usuario' }, process.env.JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
  const forb = await req('POST', '/api/productos', { body: { nombre: 'X', precio: 10, stock: 1 }, token: fakeToken });
  ok(forb.status === 403, 'Sin rol admin -> 403');

  // 10. CRUD completo
  console.log('\n[10] CRUD completo');
  const created = await req('POST', '/api/productos', {
    body: { nombre: 'SmokeProd', precio: 50, stock: 5, categoria: 'Test' },
    token,
  });
  ok(created.status === 201, 'Crear -> 201');
  const newId = created.data && created.data.data && created.data.data.id;
  ok(!!newId, 'ID generado');

  // obtener
  const got = await req('GET', `/api/productos/${newId}`);
  ok(got.status === 200, 'Obtener -> 200');

  // actualizar
  const upd = await req('PUT', `/api/productos/${newId}`, { body: { precio: 60 }, token });
  ok(upd.status === 200, 'Actualizar -> 200');
  ok(upd.data && upd.data.data && upd.data.data.precio === 60, 'Precio actualizado');

  // eliminar
  const del = await req('DELETE', `/api/productos/${newId}`, { token });
  ok(del.status === 204, 'Eliminar -> 204');

  // 404 después de eliminar
  const notFound = await req('GET', `/api/productos/${newId}`);
  ok(notFound.status === 404, 'Producto eliminado -> 404');

  // 11. Validaciones
  console.log('\n[11] Validaciones');
  const neg = await req('POST', '/api/productos', { body: { nombre: 'Neg', precio: -5, stock: 1 }, token });
  ok(neg.status === 400, 'Precio negativo -> 400');

  const missing = await req('GET', '/api/productos/no-existe-123');
  ok(missing.status === 404, 'Producto inexistente -> 404');

  // actualizar sin campos
  // crear uno temporal para probar update vacío
  const temp = await req('POST', '/api/productos', { body: { nombre: 'Temp', precio: 10, stock: 1 }, token });
  const tempId = temp.data.data.id;
  const emptyUpd = await req('PUT', `/api/productos/${tempId}`, { body: {}, token });
  ok(emptyUpd.status === 400, 'Actualizar sin campos -> 400');
  await req('DELETE', `/api/productos/${tempId}`, { token });

  // 12. Cambio de contraseña y restauración
  console.log('\n[12] Cambio de contraseña');
  const originalPass = process.env.ADMIN_PASSWORD || '123456';
  const newPass = 'temporal123';
  const chg = await req('PUT', '/api/auth/password', { body: { contrasenaActual: originalPass, contrasenaNueva: newPass }, token });
  ok(chg.status === 200, 'Cambio de contraseña -> 200');

  // login con nueva
  const loginNew = await req('POST', '/api/auth/login', { body: { usuario: 'admin', contraseña: newPass } });
  ok(loginNew.status === 200, 'Login con nueva contraseña -> 200');
  const token2 = loginNew.data.token;

  // restaurar
  const restore = await req('PUT', '/api/auth/password', { body: { contrasenaActual: newPass, contrasenaNueva: originalPass }, token: token2 });
  ok(restore.status === 200, 'Restaurar contraseña -> 200');

  // verificar login original
  const loginOrig = await req('POST', '/api/auth/login', { body: { usuario: 'admin', contraseña: originalPass } });
  ok(loginOrig.status === 200, 'Login original restaurado -> 200');

  // 13. JSON mal formado
  console.log('\n[13] JSON mal formado');
  const malformed = await fetch(BASE + '/api/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: '{ invalid json',
  });
  ok(malformed.status === 400, 'JSON mal formado -> 400');

  console.log(`\n=== Resultado: ${passed} pasaron, ${failed} fallaron ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Error en smoke test:', e);
  process.exit(1);
});