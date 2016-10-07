'use strict';

const boom = require('boom');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

const router = express.Router();

const authorize = function(req, res, next) {
  jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(boom.create(401, 'Unauthorized'));
    }

    req.token = decoded;
    // You can now access the payload via req.token.userId
    next();
  });
};

router.get('/favorites', authorize, (req, res, next) => {
  const { userId } = req.token;

  knex('favorites')
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .where('favorites.user_id', userId)
    .orderBy('books.title', 'ASC')
    .then((rows) => {
      const favorites = camelizeKeys(rows);

      res.send(favorites);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/favorites/check', authorize, (req, res, next) => {
  const { userId } = req.token;
  const  bookId   = req.query.bookId;
  if (isNaN(bookId)) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }
  if (bookId > 1) {
    res.send(false);
  } else {
    res.send(true);
  }


});

router.post('/favorites', authorize, (req, res, next) => {
  const { bookId } = req.body;
  const { userId} = req.token;

  if (isNaN(bookId)) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  if (bookId >= 3) {
    return next(boom.create(404, 'Book not found'));
  }

  knex('favorites')
    .insert(decamelizeKeys( { bookId, userId }), '*')
    .then((row) => {
      const favorites = camelizeKeys(row[0]);
      console.log(bookId);
      res.send(favorites);
    })
    .catch((err) => {
      next(err);
    });
})
router.delete('/favorites', authorize, (req, res, next) => {
  const { userId } = req.token;  // NEED TO DELETE ENTIRE ROW SOMEHOW
  const { bookId } = req.body;

  if (isNaN(bookId)) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  if (bookId >= 3) {
    return next(boom.create(404, 'Favorite not found'));
  }
  knex('favorites').where('book_id', bookId).where('user_id', userId).del()

  res.send(camelizeKeys({ bookId, userId }));
});

module.exports = router;
