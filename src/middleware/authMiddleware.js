const authService = require('../services/authService');

function verificar(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return res.status(401).json({ ok: false, mensaje: 'Token no proporcionado.' });
  }

  const partes = String(authHeader).split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ ok: false, mensaje: 'Formato de token inválido.' });
  }

  try {
    const resultado = authService.verificarToken(partes[1]);
    req.usuario = resultado.usuario;
    next();
  } catch (err) {
    const codigo = err.codigo || err.status || 401;
    return res.status(codigo).json({ ok: false, mensaje: err.mensaje || 'Token inválido.' });
  }
}

function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ ok: false, mensaje: 'Acceso denegado: se requiere rol admin.' });
  }
  next();
}

module.exports = { verificar, soloAdmin };