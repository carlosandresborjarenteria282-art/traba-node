const { leer } = require('../src/config/database');

const estado = leer();
console.log('Usuarios:', estado.usuarios.length);
console.log('Productos:', estado.productos.length);
console.log('---');
for (const u of estado.usuarios) {
  console.log(`Usuario: ${u.usuario} | rol: ${u.rol} | hash: ${String(u.passwordHash).slice(0, 12)}...`);
}
console.log('---');
for (const p of estado.productos) {
  console.log(`${p.id} | ${p.nombre} | precio: ${p.precio} | stock: ${p.stock}`);
}