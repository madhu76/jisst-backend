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

// updateManuscriptNumber (admin only)
router.patch('/manuscript/number/:id', jsonParser, controller.updateManuscriptNumber);
// getAssociateEditors
router.get('/associateeditors', controller.getAssociateEditors);
// addAssociateEditor (admin only)
router.post('/associateeditors', jsonParser, controller.addAssociateEditor);

// getManagingEditors
router.get('/managingeditors', controller.getManagingEditors);
// addManagingEditor (admin only)
router.post('/managingeditors', jsonParser, controller.addManagingEditor);

// getStreams
router.get('/streams', controller.getStreams);
// addStream (admin only)
router.post('/streams', jsonParser, controller.addStream);

// Delete reviews / revisions (admin only)
router.delete('/manuscript/:id/review', jsonParser, controller.deleteReview);
router.delete('/manuscript/:id/revision', jsonParser, controller.deleteRevision);

// Archive routes - for accepted manuscripts with volume/issue
router.get('/archived', controller.getArchivedManuscripts);
router.patch('/archived/:id', jsonParser, controller.updateArchiveDetails);


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