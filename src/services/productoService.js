const { v4: uuidv4 } = require('uuid');
const { leer, escribir } = require('../config/database');

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function validarNombre(nombre) {
  if (nombre === undefined || nombre === null || String(nombre).trim() === '') {
    throw { codigo: 400, mensaje: 'El nombre no puede estar vacío.' };
  }
}

function validarPrecio(precio) {
  const num = Number(precio);
  if (isNaN(num) || num <= 0) {
    throw { codigo: 400, mensaje: 'El precio debe ser un número mayor que 0.' };
  }
}

function validarStock(stock) {
  if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
    throw { codigo: 400, mensaje: 'El stock debe ser un entero mayor o igual a 0.' };
  }
}

function listarProductos({ buscar, categoria } = {}) {
  const estado = leer();
  let productos = [...estado.productos];

  const termino = normalizarTexto(buscar);
  if (termino) {
    productos = productos.filter((p) => {
      const nombre = normalizarTexto(p.nombre);
      const descripcion = normalizarTexto(p.descripcion);
      const cat = normalizarTexto(p.categoria);
      return (
        nombre.includes(termino) ||
        descripcion.includes(termino) ||
        cat.includes(termino)
      );
    });
  }

  if (categoria) {
    const catNorm = normalizarTexto(categoria);
    productos = productos.filter(
      (p) => normalizarTexto(p.categoria) === catNorm
    );
  }

  productos.sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  return productos;
}

function obtenerProductoPorId(id) {
  const estado = leer();
  return estado.productos.find((p) => p.id === id) || null;
}

function crearProducto(datos) {
  if (!datos || typeof datos !== 'object') {
    throw { codigo: 400, mensaje: 'Datos inválidos.' };
  }

  validarNombre(datos.nombre);
  if (datos.precio === undefined) {
    throw { codigo: 400, mensaje: 'El precio es obligatorio.' };
  }
  validarPrecio(datos.precio);
  if (datos.stock === undefined) {
    throw { codigo: 400, mensaje: 'El stock es obligatorio.' };
  }
  validarStock(datos.stock);

  const ahora = new Date().toISOString();
  const nuevo = {
    id: uuidv4(),
    nombre: String(datos.nombre).trim(),
    descripcion: datos.descripcion ? String(datos.descripcion).trim() : '',
    precio: parseFloat(datos.precio),
    categoria: datos.categoria ? String(datos.categoria).trim() : '',
    stock: parseInt(datos.stock, 10),
    createdAt: ahora,
    updatedAt: ahora,
  };

  const estado = leer();
  estado.productos.push(nuevo);
  escribir(estado);
  return nuevo;
}

function actualizarProducto(id, datos) {
  if (!datos || typeof datos !== 'object') {
    throw { codigo: 400, mensaje: 'Datos inválidos.' };
  }

  const campos = ['nombre', 'descripcion', 'precio', 'categoria', 'stock'];
  const enviados = campos.filter((c) => datos[c] !== undefined);
  if (enviados.length === 0) {
    throw { codigo: 400, mensaje: 'Debe enviar al menos un campo para actualizar.' };
  }

  const estado = leer();
  const indice = estado.productos.findIndex((p) => p.id === id);
  if (indice === -1) {
    throw { codigo: 404, mensaje: 'Producto no encontrado.' };
  }

  const producto = estado.productos[indice];

  if (datos.nombre !== undefined) {
    validarNombre(datos.nombre);
    producto.nombre = String(datos.nombre).trim();
  }
  if (datos.descripcion !== undefined) {
    producto.descripcion = String(datos.descripcion).trim();
  }
  if (datos.precio !== undefined) {
    validarPrecio(datos.precio);
    producto.precio = parseFloat(datos.precio);
  }
  if (datos.categoria !== undefined) {
    producto.categoria = String(datos.categoria).trim();
  }
  if (datos.stock !== undefined) {
    validarStock(datos.stock);
    producto.stock = parseInt(datos.stock, 10);
  }

  producto.updatedAt = new Date().toISOString();
  estado.productos[indice] = producto;
  escribir(estado);
  return producto;
}

function eliminarProducto(id) {
  const estado = leer();
  const indice = estado.productos.findIndex((p) => p.id === id);
  if (indice === -1) {
    throw { codigo: 404, mensaje: 'Producto no encontrado.' };
  }
  estado.productos.splice(indice, 1);
  escribir(estado);
  return true;
}

function obtenerEstadisticas() {
  const estado = leer();
  const productos = estado.productos;
  const totalProductos = productos.length;
  const unidadesDisponibles = productos.reduce((acc, p) => acc + (p.stock || 0), 0);
  const valorInventario = productos.reduce(
    (acc, p) => acc + (p.precio || 0) * (p.stock || 0),
    0
  );
  const stockBajo = productos.filter((p) => (p.stock || 0) <= 5).length;

  return {
    totalProductos,
    unidadesDisponibles,
    valorInventario: parseFloat(valorInventario.toFixed(2)),
    stockBajo,
  };
}

module.exports = {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerEstadisticas,
};