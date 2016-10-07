/* eslint-disable max-len, camelcase, new-cap */

'use strict';

const boom = require('boom');
const bcrypt = require('bcrypt-as-promised');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys } = require('humps'); // decamelizeKeys not used in this file

const router = express.Router(); // allows middleware (post, get...)

const authorize = function(req, res, next) {
  jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, _decoded) => {
    if (err) {
      req.verify = false;
    }
    else {
      req.verify = true;
    }
    next();
  });
};

router.get('/token', authorize, (req, res, _next) => {
  res.send(req.verify);
});

router.post('/token', (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return next(boom.create(400, 'Email must not be blank'));
  }

  if (!password || password.length < 8) {
    return next(boom.create(400, 'Password must not be blank'));
  }

  let user;

  knex('users')
    .where('email', email)
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(400, 'Bad email or password'); // really bad email
      }

      user = camelizeKeys(row); // object

      return bcrypt.compare(password, user.hashedPassword); // returns a promise
    })
    .then(() => {
      delete user.hashedPassword;

      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 3); // 3 hours
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: '3h'
      });

      res.cookie('token', token, {
        httpOnly: true,
        expires: expiry,
        secure: router.get('env') === 'production'
      });

      res.send(user);
    })
    .catch(bcrypt.MISMATCH_ERROR, () => {
      throw boom.create(400, 'Bad email or password'); // really bad password
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/token', (req, res, _next) => {
  res.clearCookie('token');
  res.send(true);
});

module.exports = router;
