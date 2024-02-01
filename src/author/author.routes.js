const express = require('express');
const upload=require("../utilities/multer");
const controller = require('./author.controller');
const router = express.Router();
var bodyParser = require('body-parser')

// create application/json parser

var jsonParser = bodyParser.json()
const defaultLoginError = 'USER NOT FOUND';

router.get('/', controller.get);


router.post(
  '/newsubmission', jsonParser,
  controller.newsubmissionData,
);

router.post(
  '/newfilesubmission', jsonParser,upload.single("image"),
  controller.newfilesubmissionData,
);

router.post(
  '/articlefilesubmission', jsonParser,upload.single("article"),
  controller.articleFileSubmission,
);

router.post(
  '/articlesubmission', jsonParser,
  controller.articleSubmissionData,
);

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

router.get('/newsubmission/:id', jsonParser,
);

router.get('/newfilesubmission/:id', jsonParser,
);

router.get('/downloads/:id',jsonParser, controller.downloadArticle);

module.exports = router;