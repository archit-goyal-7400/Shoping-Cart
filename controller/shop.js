const Product = require("../models/product");
const Order = require("../models/order");
const fs = require('fs');
const path = require('path');
const PDFdocument = require('pdfkit');

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "ALL PRODUCTS",
        path: "/products",
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        isAuthenticated: req.session.isLoggedIn,
        // csrfToken: req.csrfToken()
      });
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const cartProducts = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: cartProducts,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product)
    })
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteFromCart(prodId)
    .then(result => {
      res.redirect("/cart");
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};


// exports.getCheckout = (req, res, next) => {
//   res.render("shop/checkout", { path: "/checkout", pageTitle: "checkout" });
// };

exports.postOrders = (req, res, next) => {
  //Wihout using populate method.Using promise............
  const cartProducts = [];
  return new Promise((resolve, rejevt) => {
    let x = 0;
    req.user.cart.items.forEach((item, index, array) => {
      console.log(fetchedItem);
      Product.findById(item.productId)
        .then(product => {
          return {
            quantity: item.quantity,
            product: {
              _id: product._id,
              title: product.title,
              price: product.price,
              descripton: product.descripton,
              imageUrl: product.imageUrl
            }
          };
        })
        .then(p => {
          cartProducts.push(p);
          x++;
          if (x == array.length) {
            resolve();
          }
        });
    });
  })
    .then(result => {
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        items: cartProducts
      });
      return order.save()
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(result => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
  //using ppoulate method
  // req.user
  //   .populate('cart.items.productId')
  //   .execPopulate()
  //   .then(user => {
  //     const cartProducts = user.cart.items.map(i => {
  //       return { quantity: i.quantity, product: { ...i.productId._doc } };
  //     });
  //     console.log('kk', cartProducts);
  //     const order = new Order({
  //       user: {
  //         email: req.user.email,
  //         userId: req.user
  //       },
  //       items: cartProducts
  //     });
  //     return order.save()
  //   })
  //   .then(result => {
  //     return req.user.clearCart();
  //   })
  //   .then(result => {
  //     res.redirect('/orders');
  //   })
  //   .catch(err => {
  //     const error = new Error(err);
  //     next(error);
  //   });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render("shop/orders", {
        path: "/orders", pageTitle: "Orders", orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findOne({ _id: orderId })
    .then(order => {
      if (!order) {
        return next(new Error('Order not found'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Not authorized'));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join('data', 'invoice', invoiceName);
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', 'inline;filename="' + invoiceName + '"');
      //   res.send(data);
      // });
      const pdfDoc = new PDFdocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline;filename="' + invoiceName + '"');
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(23).text('Invoice', {
        underline: true
      });
      let totalPrice = 0;
      order.items.forEach(prod => {
        totalPrice += prod.quantity + prod.product.price;
        pdfDoc.fontSize(13).text(prod.product.title + " - " + prod.quantity + " X " + prod.product.price);
      });
      pdfDoc.fontSize(13).text('-------------------');
      pdfDoc.fontSize(19).text('Total Price = ' + totalPrice);
      pdfDoc.end();
      // const file = fs.createReadStream(invoicePath);
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader('Content-Disposition', 'inline;filename="' + invoiceName + '"');
      // file.pipe(res);
    })
    .catch(err => {
      return next(err);
    });

}