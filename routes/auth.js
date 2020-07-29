const express = require('express');

const authControllers = require('../controller/auth');

const router = express.Router();

const { check, body } = require('express-validator/check');

const User = require('../models/user');

router.get('/login', authControllers.getLogin);
router.post('/login', check('email').isEmail(), authControllers.postLogin);
router.post('/logout', authControllers.postLogout);
router.get('/signup', authControllers.getSignup);
router.post('/signup',
    check('email').isEmail()
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(user => {
                if (user) {
                    return Promise.reject('Email already exist...');
                }
            });
        }),
    body('password', 'Invali Password')
        .isLength({ min: 5 })
        .isAlphanumeric(),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password do not match.......');
            }
            return true;
        }),
    authControllers.postSignup);
router.get('/reset', authControllers.getReset);
router.post('/reset', authControllers.postReset);
router.get('/reset-password/:token', authControllers.getResetPassword);
router.post('/reset-password', authControllers.postResetPassword);
module.exports = router;