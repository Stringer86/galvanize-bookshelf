'use strict';

const boom = require('boom');
const express = require('express');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

// YOUR CODE HERE
router.get('/books', (_req, res, next) => {
  knex('books')
    .orderBy('title')
    .then((rows) => {
      const books = camelizeKeys(rows);

      res.send(books);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/books/:id', (req, res, next) => {
  if (isNaN(req.params.id)) {
    return next();
  }
  knex('books')
  .where('id', req.params.id)
  .first() // gets first row.
  .then((row) => {
    if (!row) {
      throw boom.create(404, 'Not Found'); // throws it
    }

    const book = camelizeKeys(row);

    res.send(book);
  })
  .catch((err) => { //catches error from line 34
    next(err);
  });
});

router.post('/books', (req, res, next) => {
  const { title, author, genre, description, coverUrl } = req.body;

  if (!title || !title.trim()) {
    return next(boom.create(400, 'Title must not be blank'));
  }

  if (!author || !author.trim()) {
    return next(boom.create(400, 'Author must not be blank'));
  }

  if (!genre || !genre.trim()) {
    return next(boom.create(400, 'Genre must not be blank'));
  }

  if (!description || !description.trim()) {
    return next(boom.create(400, 'Description must not be blank'));
  }

  if (!coverUrl || !coverUrl.trim()) {
    return next(boom.create(400, 'Cover URL must not be blank'));
  }

  const insertBook = { title, author, genre, description, coverUrl };

  knex('books')
    .insert(decamelizeKeys(insertBook), '*')
    .then((rows) => {
      const book = camelizeKeys(rows[0]);

      res.send(book);
    })
    .catch((err) => {
      next(err);
    });
});

router.patch('/books/:id', (req, res, next) => {
  if (isNaN(req.params.id)) {
    return next();
  }
  knex('books')
    .where('id', req.params.id)
    .first()
    .then((book) => {
      if (!book) {
        throw boom.create(404, 'Not Found');
      }

      const { title, author, genre, description, coverUrl } = req.body;
      const updateBook = {};

      if (title) {
        updateBook.title = title;
      }
      if (author) {
        updateBook.author = author;
      }
      if (genre) {
        updateBook.genre = genre;
      }
      if (description) {
        updateBook.description = description;
      }
      if (coverUrl) {
        updateBook.coverUrl = coverUrl;
      }

      return knex('books')
        .update(decamelizeKeys(updateBook), '*')
        .where('id', req.params.id);
    })
    .then((rows) => {
      const book = camelizeKeys(rows[0]);

      res.send(book);
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/books/:id', (req, res, next) => {
  if (isNaN(req.params.id)) {
    return next();
  }
  let book;

  knex('books')
    .where('id', req.params.id)
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(404, 'Not Found');
      }

      book = camelizeKeys(row);

      return knex('books')
        .del()
        .where('id', req.params.id);
    })
    .then(() => {
      delete book.id;

      res.send(book);
    })
    .catch((err) => {
      next(err);
    });
});
module.exports = router;
