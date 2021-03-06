const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.signup = (req, res, next) => {
  console.log(req.body)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  let loadedUser;

  bcrypt
    .hash(password, 8)
    .then(hashedPw => {
      const user = new User({
        email: email,
        password: hashedPw,
        name: name
      });
      return user.save();
    })
    .then(result => {

      const token = jwt.sign({
        email: email,
        userId: result._id.toString()
      }, process.env.APP_SECRET, { expiresIn: '1h' });

      res.status(201).json({
        massage: 'user created',
        userId: result._id,
        idToken: token,
        expiresIn: 3600,
        error: false
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        const error = new Error('A user with this email could not be found.');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      if (!isEqual) {
        console.log('not')
        const error = new Error('Wrong password!');
        error.statusCode = 401;
        throw error;
      }
      
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString()
        },
        process.env.APP_SECRET, { expiresIn: '1h' }
      );
      
      res.status(200).json({ 
        idToken: token, 
        userId: loadedUser._id.toString(),
        expiresIn: 3600,
       });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};