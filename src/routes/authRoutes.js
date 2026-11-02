const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificar } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.registrar);
router.put('/password', verificar, authController.cambiarContrasena);

module.exports = router;