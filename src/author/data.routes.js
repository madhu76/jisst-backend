const express = require('express');
const multer = require('multer');
const controller = require('./data.controller');
const router = express.Router();
var bodyParser = require('body-parser')
const upload = multer({ dest: 'tmp/' });

// create application/json parser

var jsonParser = bodyParser.json()

router.get('/', controller.get);

router.get(
  '/articles',jsonParser,
  controller.getArticlesData,
);

router.get(
  '/download',jsonParser,
  controller.getDownloadData,
);

router.get(
  '/views',jsonParser,
  controller.getViewsData,
);

router.get('/articles/:id', jsonParser,
 controller.displayArticle);

router.get('/downloads/:id',jsonParser, controller.downloadArticle);

router.get('/manuscript',jsonParser, controller.getManuscripts);

router.post('/manuscript',upload.single('file'), controller.submitManuscript);

router.patch('/manuscript/:id',jsonParser, controller.updateManuscript);

module.exports = router;