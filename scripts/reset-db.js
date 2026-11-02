const { reiniciar } = require('../src/config/database');

const estado = reiniciar();
console.log('Base de datos reiniciada.');
console.log('Usuarios:', estado.usuarios.length);
console.log('Productos:', estado.productos.length);