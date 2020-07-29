const express = require('express');
const path = require('path');
const router = express.Router();
const adminControllers = require("../controller/admin");
const isAuth = require('../middleware/is-auth');
const { check } = require('express-validator/check');

router.get('/add-product', isAuth, adminControllers.getAddProduct);

router.get('/products', isAuth, adminControllers.getProducts);

router.post('/add-product',
    check('title').isString().isLength({ min: 3 }),
    check('description').isString().isLength({ min: 5, max: 250 }),
    check('price').isInt(),
    isAuth, adminControllers.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminControllers.getEditProduct);

router.post('/edit-product',
    check('title').isString().isLength({ min: 3 }),
    check('description').isString().isLength({ min: 5, max: 250 }),
    check('price').isInt(),
    isAuth, adminControllers.postEditProduct);

router.post('/delete-product', isAuth, adminControllers.postDeleteProduct);

module.exports = router;
