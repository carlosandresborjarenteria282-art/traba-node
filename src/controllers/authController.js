const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const body = req.body || {};
    const usuario = body.usuario;
    const contrasena =
      body.contraseña !== undefined ? body.contraseña : body.contrasena;

    const resultado = await authService.autenticar(usuario, contrasena);
    return res.status(200).json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso.',
      token: resultado.token,
      usuario: resultado.usuario,
    });
  } catch (error) {
    next(error);
  }
}

async function registrar(req, res, next) {
  try {
    const body = req.body || {};
    const usuario = body.usuario;
    const contrasena =
      body.contraseña !== undefined ? body.contraseña : body.contrasena;

    const resultado = await authService.registrar({ usuario, contrasena });
    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado correctamente.',
      token: resultado.token,
      usuario: resultado.usuario,
    });
  } catch (error) {
    next(error);
  }
}

async function cambiarContrasena(req, res, next) {
  try {
    const resultado = await authService.cambiarContrasena(req.usuario.id, req.body || {});
    return res.status(200).json({
      ok: true,
      mensaje: 'Contraseña actualizada correctamente.',
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, registrar, cambiarContrasena };