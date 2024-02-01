const express = require('express');
const app = express();
const cors = require('cors')
const author = require('./author/author.routes');
app.use(cors());
app.get('/', (req, res) => {
  res.json({
    "message": "Hello from eps"
  })
});
app.use(
  '/author',
  author,
);
module.exports = app;
