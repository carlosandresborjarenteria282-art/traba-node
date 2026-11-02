require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { leer, escribir } = require('../config/database');
const jwtConfig = require('../config/jwt');

async function autenticar(usuario, contrasena) {
  if (!usuario || contrasena === undefined || contrasena === null || contrasena === '') {
    throw { codigo: 400, mensaje: 'Usuario y contraseña son obligatorios.' };
  }

  const encontrado = leer().usuarios.find(
    (u) => u.usuario === String(usuario).trim()
  );

  if (!encontrado) {
    throw { codigo: 401, mensaje: 'Credenciales incorrectas.' };
  }

  const coincide = await bcrypt.compare(String(contrasena), encontrado.passwordHash);
  if (!coincide) {
    throw { codigo: 401, mensaje: 'Credenciales incorrectas.' };
  }

  const token = jwt.sign(
    { id: encontrado.id, usuario: encontrado.usuario, rol: encontrado.rol },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn, algorithm: jwtConfig.algorithm }
  );

  return {
    token,
    usuario: {
      id: encontrado.id,
      usuario: encontrado.usuario,
      rol: encontrado.rol,
    },
  };
}

async function registrar({ usuario, contrasena }) {
  if (!usuario || String(usuario).trim() === '') {
    throw { codigo: 400, mensaje: 'El usuario es obligatorio.' };
  }
  if (!contrasena || String(contrasena).length < 6) {
    throw { codigo: 400, mensaje: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const estado = leer();
  const existe = estado.usuarios.find(
    (u) => u.usuario === String(usuario).trim()
  );
  if (existe) {
    throw { codigo: 400, mensaje: 'El usuario ya existe.' };
  }

  const passwordHash = await bcrypt.hash(String(contrasena), 10);
  const nuevo = {
    id: estado.usuarios.length ? Math.max(...estado.usuarios.map((u) => Number(u.id) || 0)) + 1 : 1,
    usuario: String(usuario).trim(),
    passwordHash,
    rol: 'admin',
    creadoEn: new Date().toISOString(),
  };

  estado.usuarios.push(nuevo);
  escribir(estado);

  const token = jwt.sign(
    { id: nuevo.id, usuario: nuevo.usuario, rol: nuevo.rol },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn, algorithm: jwtConfig.algorithm }
  );

  return {
    token,
    usuario: {
      id: nuevo.id,
      usuario: nuevo.usuario,
      rol: nuevo.rol,
    },
  };
}

function verificarToken(token) {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
    });
    return { valido: true, usuario: decoded };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw { codigo: 401, mensaje: 'El token ha expirado.' };
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw { codigo: 401, mensaje: 'Token inválido.' };
    }
    throw { codigo: 401, mensaje: 'Token inválido.' };
  }
}

async function cambiarContrasena(id, { contrasenaActual, contrasenaNueva }) {
  const estado = leer();
  const usuario = estado.usuarios.find((u) => u.id === id);
  if (!usuario) {
    throw { codigo: 404, mensaje: 'Usuario no encontrado.' };
  }

  if (!contrasenaActual) {
    throw { codigo: 400, mensaje: 'La contraseña actual es obligatoria.' };
  }
  if (!contrasenaNueva || String(contrasenaNueva).length < 6) {
    throw { codigo: 400, mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }
  if (String(contrasenaActual) === String(contrasenaNueva)) {
    throw { codigo: 400, mensaje: 'La nueva contraseña debe ser distinta a la actual.' };
  }

  const coincide = await bcrypt.compare(String(contrasenaActual), usuario.passwordHash);
  if (!coincide) {
    throw { codigo: 401, mensaje: 'La contraseña actual es incorrecta.' };
  }

  usuario.passwordHash = await bcrypt.hash(String(contrasenaNueva), 10);
  escribir(estado);
  return { ok: true };
}

module.exports = { autenticar, registrar, cambiarContrasena, verificarToken };