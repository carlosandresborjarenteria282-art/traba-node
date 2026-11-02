const productoService = require('../services/productoService');

function listarProductos(req, res, next) {
  try {
    const { buscar, categoria } = req.query;
    const data = productoService.listarProductos({ buscar, categoria });
    return res.status(200).json({
      ok: true,
      mensaje: 'Productos obtenidos correctamente.',
      total: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

function obtenerEstadisticas(req, res, next) {
  try {
    const data = productoService.obtenerEstadisticas();
    return res.status(200).json({
      ok: true,
      mensaje: 'Estadísticas obtenidas correctamente.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

function obtenerProducto(req, res, next) {
  try {
    const producto = productoService.obtenerProductoPorId(req.params.id);
    if (!producto) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
    }
    return res.status(200).json({
      ok: true,
      mensaje: 'Producto obtenido correctamente.',
      data: producto,
    });
  } catch (error) {
    next(error);
  }
}

function crearProducto(req, res, next) {
  try {
    const nuevo = productoService.crearProducto(req.body || {});
    return res.status(201).json({
      ok: true,
      mensaje: 'Producto creado correctamente.',
      data: nuevo,
    });
  } catch (error) {
    next(error);
  }
}

function actualizarProducto(req, res, next) {
  try {
    const actualizado = productoService.actualizarProducto(req.params.id, req.body || {});
    return res.status(200).json({
      ok: true,
      mensaje: 'Producto actualizado correctamente.',
      data: actualizado,
    });
  } catch (error) {
    next(error);
  }
}

function eliminarProducto(req, res, next) {
  try {
    productoService.eliminarProducto(req.params.id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarProductos,
  obtenerEstadisticas,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};