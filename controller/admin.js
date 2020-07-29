const Product = require("../models/product");
const { validationResult } = require('express-validator/check');
const fileHelper = require('../util/fileHelper');

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: null,
    isError: false
  });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .select('title price description imageUrl')//Not compulsory -- used to select the data which will be in product
    .populate('userId', 'name')//to include user details in product.. second argument is not compulsory..it is used to select from the user properties which data want to select  we cat exclude field by ('-name ' )
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      product: {
        title: title,
        description: description,
        price: price
      },
      errorMessage: "Image is not in the required format",
      isError: true
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fileHelper.deleteFile(image.path);
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      product: {
        title: title,
        description: description,
        price: price
      },
      errorMessage: errors.array()[0].msg,
      isError: true
    });
  }
  const imageUrl = image.path;
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product.save()
    .then((result) => {
      res.redirect('/admin/products');
    }).catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-products",
        editing: editMode,
        product: product,
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: null,
        isError: false
      })
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const prodId = req.body.productId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: true,
      isAuthenticated: req.session.isLoggedIn,
      product: {
        _id: prodId,
        title: title,
        description: description,
        price: price
      },
      errorMessage: errors.array()[0].msg,
      isError: true
    });
  }
  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = title;
      product.description = description;
      product.price = price;
      if (image) {
        fileHelper.deleteFile(image.path);
        product.imageUrl = image.path;
      }
      return product.save().then((result) => {
        res.redirect('/admin/products');
      });
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findOne({ _id: prodId })
    .then(product => {
      if (!product) {
        return next(err);
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ userId: req.user._id, _id: prodId })
    })
    .then((result) => {
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};
