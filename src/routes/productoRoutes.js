const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { verificar, soloAdmin } = require('../middleware/authMiddleware');

router.get('/', productoController.listarProductos);
router.get('/estadisticas', productoController.obtenerEstadisticas);
router.get('/:id', productoController.obtenerProducto);

router.post('/', verificar, soloAdmin, productoController.crearProducto);
router.put('/:id', verificar, soloAdmin, productoController.actualizarProducto);
router.delete('/:id', verificar, soloAdmin, productoController.eliminarProducto);

module.exports = router;