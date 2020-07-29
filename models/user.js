const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: {
        type: String
    },
    resetTokenExDate: {
        type: Date
    },
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
            quantity: {
                type: Number
            }
        }]
    }
});

userSchema.methods.addToCart = function (product) {
    let cartProductIndex = -1;
    let fetchedCart = [];
    if (this.cart) {
        cartProductIndex = this.cart.items.findIndex(i => {
            return i.productId.toString() === product._id.toString();
        });
        fetchedCart = this.cart.items;

        //console.log(cartProductIndex);
    }

    if (cartProductIndex >= 0) {
        fetchedCart[cartProductIndex].quantity = fetchedCart[cartProductIndex].quantity + 1;
    } else {

        fetchedCart.push({ productId: product._id, quantity: 1 });
    }
    this.cart = { items: fetchedCart };
    return this.save();
}

userSchema.methods.deleteFromCart = function (prodId) {
    const prodIndex = this.cart.items.findIndex(i => {
        return i.productId.toString() === prodId.toString();
    });
    let fetchedItems = this.cart.items;
    if (fetchedItems[prodIndex].quantity > 1) {
        fetchedItems[prodIndex].quantity = fetchedItems[prodIndex].quantity - 1;
    } else {
        fetchedItems = fetchedItems.filter(i => {
            return i.productId.toString() !== prodId.toString();
        });
    }
    this.cart = { items: fetchedItems };
    return this.save();
}

userSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    this.save();
}

module.exports = mongoose.model('User', userSchema);



// const mongodb = require('mongodb');

// class User {
//     constructor(username, email, id, cart) {
//         this.username = username;
//         this.email = email;
//         this._id = id;
//         this.cart = cart;
//     }

//     save() {
//         const db = getDb();
//         return db.colletion('users').insertOne(this);
//     }

//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users')
//             .findOne({ _id: new mongodb.ObjectId(userId) });
//     }

//     addToCart(product) {
        // let cartProductIndex = -1;
        // let fetchedCart = [];
        // if (this.cart) {
        //     cartProductIndex = this.cart.items.findIndex(i => {
        //         return i.productId.toString() === product._id.toString();
        //     });
        //     fetchedCart = this.cart.items;

        //     console.log(cartProductIndex);
        // }

        // if (cartProductIndex >= 0) {
        //     fetchedCart[cartProductIndex].quantity = fetchedCart[cartProductIndex].quantity + 1;
        // } else {

        //     fetchedCart.push({ productId: new mongodb.ObjectID(product._id), quantity: 1 });
        // }
        // const db = getDb();
        // return db.collection('users').updateOne({ _id: new mongodb.ObjectID(this._id) }, { $set: { cart: { items: fetchedCart } } });

//     }

//     getCart() {
//         const db = getDb();
//         let productIds = this.cart.items.map(i => {
//             return i.productId;
//         });
//         //console.log('ll', productIds);
//         return db.collection('products').find({ _id: { $in: productIds } })
//             .toArray()
//             .then(products => {
//                 console.log(products);
//                 return products.map(p => {
//                     p.quantity = this.cart.items.find(i => {
//                         return i.productId.toString() === p._id.toString();
//                     }).quantity;
//                     return p;
//                 });
//             })
//             .catch(err => {
//                 console.log(err);
//             });
//     }
//     deleteById(prodId) {
//         const db = getDb();
//         const prodIndex = this.cart.items.findIndex(i => {
//             return i.productId.toString() === prodId.toString();
//         });
//         let fetchedItems = this.cart.items;
//         if (fetchedItems[prodIndex].quantity > 1) {
//             fetchedItems[prodIndex].quantity = fetchedItems[prodIndex].quantity - 1;
//         } else {
//             fetchedItems = fetchedItems.filter(i => {
//                 return i.productId.toString() !== prodId.toString();
//             });
//         }
//         return db.collection('users').updateOne({ _id: new mongodb.ObjectID(this._id) }, { $set: { cart: { items: fetchedItems } } });
//     }

//     orderProduct() {
//         const db = getDb();
//         return this.getCart()
//             .then(products => {
//                 const order = {
//                     items: products,
//                     user: {
//                         _id: new mongodb.ObjectID(this._id),
//                         name: this.username
//                     }
//                 };
//                 return db.collection('orders').insertOne(order);
//             })
//             .then(result => {
//                 this.cart = { items: [] };
//                 return db.collection('users').updateOne({ _id: new mongodb.ObjectID(this._id) }, { $set: { cart: { items: [] } } });
//             }).catch(err => {
//                 console.log(err);
//             });

//     }
//     displayOrder() {
//         const db = getDb();
//         return db.collection('orders').find({ 'user._id': new mongodb.ObjectID(this._id) })
//             .toArray();
//     }

// }

// module.exports = User;