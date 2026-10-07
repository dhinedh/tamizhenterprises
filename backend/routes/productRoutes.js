const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('Owner'), createProduct);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, authorize('Owner', 'Salesman'), updateProduct)
  .delete(protect, authorize('Owner'), deleteProduct);

module.exports = router;
