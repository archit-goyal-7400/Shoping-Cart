const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodeMailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const { validationResult } = require('express-validator/check');

const tranporter = nodeMailer.createTransport(sendGridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[1].trim().split('=')[1] === 'true';
    // let message = req.flash('error');
    // console.log(message);
    // if (message.length > 0) {
    //     message = message[0];
    // }
    // else {
    //     message = null;
    // }
    //console.log(req.flash(message));
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: null,
        oldEmail: '',
        oldPassword: ''
    });
    console.log('piadjiofjioajfoindaofnon');
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    console.log(errors.isEmpty());
    if (!errors.isEmpty()) {
        //req.flash('error', errors.array()[0].msg);
        console.log('xxxxxx');
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: errors.array()[0].msg,
            oldEmail: email,
            oldPassword: password
        });
    }
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                //req.flash('error', 'invalid email or password');
                return res.render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    isAuthenticated: req.session.isLoggedIn,
                    errorMessage: 'invalid email or password',
                    oldEmail: email,
                    oldPassword: password
                });
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        console.log('xxxyyyyzzz');
                        //req.flash('error', 'invalid email or password');
                        return res.render('auth/login', {
                            path: '/login',
                            pageTitle: 'Login',
                            isAuthenticated: req.session.isLoggedIn,
                            errorMessage: 'invalid email or password',
                            oldEmail: email,
                            oldPassword: password
                        });
                    }
                    else {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            res.redirect('/');
                        });
                    }
                })
                .catch(err => {
                    console.log(err);
                    return res.redirect('/login');
                });
        })
        .catch(err => {
            const error = new Error(err);
            next(error);
        });

    // User.findById('5e899b11c826d21754ba969e')
    //     .then(user => {
    //         req.session.isLoggedIn = true;
    //         req.session.user = user;
    //         req.session.save((err) => {
    //             res.redirect('/');
    //         });
    //     })
    //     .catch(err => { console.log(err) })
    // req.session.isLoggedIn = true;
    // res.redirect('/');
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: message,
        oldEmail: ''
    });
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: errors.array()[0].msg,
            oldEmail: email
        });
    }

    bcrypt.hash(password, 12)
        .then(encryptedPassword => {
            const user = new User({
                email: email,
                password: encryptedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/login');
            return tranporter.sendMail({
                to: email,
                from: 'garchit2000@gmail.com',
                subject: 'Sign up successfully',
                html: '<h1> Successfully signed up</h1>'
            });
        }).catch(err => {
            const error = new Error(err);
            next(error);
        });
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    })
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    console.log(message);
    if (message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
    //console.log(req.flash(message));
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: message
    });
}

exports.postReset = (req, res, next) => {
    const email = req.body.email;
    var token;
    let fetchedUser;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'Email in not registered....');
                return res.redirect('/signup');
            }
            fetchedUser = user;
            crypto.randomBytes(32, (err, buffer) => {
                if (err) {
                    return res.redirect('/login');
                }
                token = buffer.toString('hex');
                console.log(token);
                user.resetToken = token;
                user.resetTokenExDate = Date.now() + 3600000;
                return user.save()
                    .then(result => {
                        req.flash('error', 'Link to reset password is sent to your mail. Please click the link to change the password');
                        res.redirect('/login');
                        tranporter.sendMail({
                            to: email,
                            from: 'garchit2000@gmail.com',
                            subject: 'Reset Password..',
                            html: `
                    <p>Click this <a href='http://localhost:3000/reset-password/${token}-${email}'>link</a> to change your password</p>
                `
                        });
                    })
            })
        })
        .catch(err => {
            const error = new Error(err);
            next(error);
        });
}

exports.getResetPassword = (req, res, next) => {
    let message = req.flash('error');
    console.log(message, 'sdfghjkfgbyhsjzkbtycs');
    if (message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
    const retrieved = req.params.token;
    const token = retrieved.split('-')[0];
    const email = retrieved.split('-')[1];
    console.log(retrieved);
    User.findOne({ resetToken: token, resetTokenExDate: { $gt: Date.now() }, email: email })
        .then(user => {
            if (!user) {
                return res.redirect('/login');
            }
            res.render('auth/reset-password', {
                path: '/reset-password',
                pageTitle: 'Reset Password',
                isAuthenticated: req.session.isLoggedIn,
                errorMessage: message,
                userId: user._id,
                token: token,

            });
        }).catch(err => {
            const error = new Error(err);
            next(error);
        });
}

exports.postResetPassword = (req, res, next) => {
    let fuser;
    User.findOne({
        resetToken: req.body.token,
        resetTokenExDate: { $gt: Date.now() },
        _id: req.body.userId
    })
        .then(user => {
            fuser = user;
            const newPassword = req.body.password;
            return bcrypt.hash(newPassword, 12);
        })
        .then(epassword => {
            fuser.password = epassword;
            fuser.resetToken = undefined;
            fuser.resetTokenExDate = undefined;
            return fuser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            next(error);
        });
}