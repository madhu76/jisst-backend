const express = require('express');
const multer = require('multer');
const controller = require('./data.controller');
const router = express.Router();
var bodyParser = require('body-parser')
const upload=require("../utilities/multer");

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

router.patch('/manuscript/:id',upload.array('files'), controller.updateManuscript);

router.patch('/manuscript/revision/:id',upload.single('file'), controller.submitRevision);

router.patch('/manuscript/editors/:id', jsonParser, controller.updateEditorsInManuscript);
// getAssociateEditors
router.get('/associateeditors', controller.getAssociateEditors);


// Post Calls for Admin

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


module.exports = router;