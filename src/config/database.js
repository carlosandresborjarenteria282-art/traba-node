require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const RAIZ_PROYECTO = path.resolve(__dirname, '..', '..');
const DB_PATH = path.isAbsolute(process.env.DB_PATH || '')
  ? process.env.DB_PATH
  : path.resolve(RAIZ_PROYECTO, process.env.DB_PATH || './data/catalogo.json');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

function crearEstadoInicial() {
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  const ahora = new Date().toISOString();
  return {
    usuarios: [
      {
        id: 1,
        usuario: ADMIN_USER,
        passwordHash,
        rol: 'admin',
        creadoEn: ahora,
      },
    ],
    productos: [
      {
        id: 'prod-001',
        nombre: 'Laptop',
        descripcion: 'Laptop de alto rendimiento',
        precio: 1299.99,
        categoria: 'Computadoras',
        stock: 12,
        createdAt: ahora,
        updatedAt: ahora,
      },
      {
        id: 'prod-002',
        nombre: 'Mouse',
        descripcion: 'Mouse inalámbrico ergonómico',
        precio: 29.99,
        categoria: 'Accesorios',
        stock: 45,
        createdAt: ahora,
        updatedAt: ahora,
      },
      {
        id: 'prod-003',
        nombre: 'Teclado',
        descripcion: 'Teclado mecánico retroiluminado',
        precio: 89.5,
        categoria: 'Accesorios',
        stock: 30,
        createdAt: ahora,
        updatedAt: ahora,
      },
    ],
  };
}

function leer() {
  if (!fs.existsSync(DB_PATH)) {
    const inicial = crearEstadoInicial();
    escribir(inicial);
    return inicial;
  }

  const texto = fs.readFileSync(DB_PATH, 'utf8').trim();
  let datos = {};
  try {
    datos = texto ? JSON.parse(texto) : {};
  } catch (e) {
    datos = {};
  }

  const estado = {
    usuarios: Array.isArray(datos.usuarios) ? datos.usuarios : [],
    productos: Array.isArray(datos.productos) ? datos.productos : [],
  };

  if (estado.usuarios.length === 0) {
    const inicial = crearEstadoInicial();
    estado.usuarios = inicial.usuarios;
    escribir(estado);
  }

  return estado;
}

function escribir(estado) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(
    DB_PATH,
    `${JSON.stringify(
      { usuarios: estado.usuarios || [], productos: estado.productos || [] },
      null,
      2
    )}\n`,
    'utf8'
  );
}

function estado() {
  const datos = leer();
  return {
    ok: true,
    baseDatos: 'JSON',
    ruta: DB_PATH,
    usuarios: datos.usuarios.length,
    productos: datos.productos.length,
  };
}

function reiniciar() {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  return leer();
}

module.exports = { leer, escribir, estado, reiniciar, DB_PATH };