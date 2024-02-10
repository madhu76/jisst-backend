const express = require('express');
const app = express();
const cors = require('cors')
const data = require('./author/data.routes');
const mongoose = require('./db/connection'); //DB connection
const { sendMail } = require('./utilities/emailService');

app.use(cors());
app.get('/', (req, res) => {
  res.json({
    "message": "Hello from eps"
  })
});
app.use(
  '/author',
  data,
);
module.exports = app;
