const express = require('express');
const path = require('path');

const shopControllers = require('../controller/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopControllers.getIndex);

router.get('/products', shopControllers.getProducts);

router.get('/products/:productId', shopControllers.getProduct);

router.get('/cart', isAuth, shopControllers.getCart);

router.post('/cart', isAuth, shopControllers.postCart);

router.post('/cart-delete-product', isAuth, shopControllers.postCartDeleteProduct);

// // router.get('/checkout', shopControllers.getCheckout);

router.post('/create-order', isAuth, shopControllers.postOrders);

router.get('/orders', isAuth, shopControllers.getOrders);

router.get('/orders/:orderId', isAuth, shopControllers.getInvoice);

module.exports = router;