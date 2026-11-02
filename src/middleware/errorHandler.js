function errorHandler(err, req, res, next) {
  // JSON mal formado
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, mensaje: 'JSON mal formado.' });
  }

  const codigo = (err && (err.codigo || err.status)) || 500;
  const mensaje = (err && err.mensaje) || (err && err.message) || 'Error interno del servidor.';
  if (codigo >= 500) {
    console.error(err);
  }
  return res.status(codigo).json({ ok: false, mensaje });
}

module.exports = { errorHandler };