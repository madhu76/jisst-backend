const Articlesubmission = require('./articlesubmission');
const ArticleFileSubmission = require('./articlefilesubmission');
const cloudinary = require("../utilities/cloudinary");
const ManuscriptSubmissions = require('./newManuscriptSubmission');
const AllowedEmailAddresses = require('./allowedEmails');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utilities/emailService');

const get = (req, res) => {
  res.json({
    message: 'Hello Author! 🔐',
  });
};

const successfulSubmissionEmailTemplate = (submissionId) => {
  return `Your manuscript has been submitted successfully!<br>
You can track the status of your manuscript from https://www.jisst.com/my-submissions.<br>
<br>
Your submission ID is: ${submissionId}<br>
<br>
Regards,<br>
JISST Team`;
}

const statusUpdateEmailTemplate = (submissionId, status, title) => {
  return `Your manuscript with ID ${submissionId} has been updated to status: ${status}.<br>
Title: ${title}<br>
<br>
You can track the status of your manuscript from https://www.jisst.com/my-submissions.<br>
<br>
Regards,<br>
JISST Team`;
}

const displayArticle = async (req, res, next) => {
  try {
    const article = await Articlesubmission.findOne({ item_id: req.params.id }, '-fileUrl');
    let view = article.views;
    Articlesubmission.updateOne({ item_id: req.params.id }, { $set: { views: view + 1 } },
      function (err, results) {
        console.log(results.result);
      });
    const updatedArticle = await Articlesubmission.findOne({ item_id: req.params.id }, '-fileUrl');
    console.log('find new article data ' + updatedArticle);
    res.json(JSON.stringify(updatedArticle));
  } catch (error) {
    res.status(500);
    next(error);
  }
};

const downloadArticle = async (req, res, next) => {
  try {
    const article = await Articlesubmission.findOne({ item_id: req.params.id });
    let download = article.downloads;
    Articlesubmission.updateOne({ item_id: req.params.id }, { $set: { downloads: download + 1 } },
      function (err, results) {
        console.log(results.result);
      });
    const updatedArticle = await Articlesubmission.findOne({ item_id: req.params.id }, '-fileUrl');
    console.log('download Article ' + updatedArticle);
    res.json(JSON.stringify(updatedArticle));
  } catch (error) {
    res.status(500);
    next(error);
  }
};


const getArticlesData = async (req, res, next) => {
  try {
    const articles = await Articlesubmission.find({}, '-fileUrl');
    let data = [];
    articles.forEach(function (ff) {
      if (ff.isTrue && ff.isTrue == true) {
        data.push(ff);
      }
    });
    // console.log(data);
    res.json(data);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const getDownloadData = async (req, res, next) => {
  try {
    const articles = await Articlesubmission.find({}, '-fileUrl').sort({ "downloads": -1, "item_id": 1 });
    let data = [];
    articles.forEach(function (ff) {
      if (ff.isTrue && ff.isTrue == true) {
        data.push(ff);
      }
    });
    console.log("this is" + data);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getViewsData = async (req, res, next) => {
  try {
    const articles = await Articlesubmission.find({}, '-fileUrl').sort({ "views": -1, "item_id": 1 });
    let data = [];
    articles.forEach(function (ff) {
      if (ff.isTrue && ff.isTrue == true) {
        data.push(ff);
      }
    });
    console.log("this is" + data);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const articleSubmissionData = async (req, res, next) => {
  try {
    let articleSubmission = new Articlesubmission(req.body);
    console.log(`data`, articleSubmission);
    articleSubmission.save((err, result) => {
      if (err) {
        console.log(err)
        res.json({ success: false, msg: 'failed to register user' });
      }
      else {
        result.success = true;
        res.json(result);
      }
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};


const articleFileSubmission = async (req, res, next) => {
  try {
    let result;
    console.log("req.body.formId = ", req.body.formId);
    if (req.file)
      result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'Articles'
      });
    else
      console.log(`upload plzzz`);
    console.log(`result`, result);
    delete req.body.image;
    let articlefilesubmission = new ArticleFileSubmission({
      avatar: result.secure_url,
      cloudinary_id: result.public_id,
      ref_id: this.id,
      formId: req.body.formId,
    });
    console.log(`data` + articlefilesubmission);
    articlefilesubmission.save(async (err, result) => {
      if (err) {
        console.log(err)
        res.json({ success: false, msg: 'failde to uplad file' });
      }
      else {
        // result.success = true;
        // console.log("result - lno 121 " , result);
        const update = {
          fileId: result._id,
          fileUrl: result.avatar,
        }
        Articlesubmission.findOneAndUpdate(
          { _id: result.formId },
          { $set: update },
          { new: true }, (err, doc) => {
            if (err) {
              console.log("error error error error", err);
            }
            else {
              console.log(doc.fileId, " ", doc.fileUrl);
            }
          });
        res.json(result);
      }
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

const submitManuscript = async (req, res) => {

  try {

    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401)
      return;
    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ManuscriptSubmissions'
    });

    // Create and save the article
    const newArticle = new ManuscriptSubmissions({
      submittedBy: email,
      title: req.body.title,
      authors: req.body.authors,
      abstract: req.body.abstract,
      keywords: req.body.keywords,
      status: 'Submitted',
      articleUrl: result.url // URL from Cloudinary
    });

    const resp = await newArticle.save();

    const emailList =  await AllowedEmailAddresses.findOne({ 'ManuscriptMailingList.Name': 'Editors' }, { 'ManuscriptMailingList.$': 1 })
    .then(doc => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        // Assuming there could be multiple matches and you want the first
        return emailIds = doc.ManuscriptMailingList[0].EmailIds;
      }
      return [];
    });

    // join email list as a comma separated string
    const ccString = emailList.join(', ');

    await sendMail(email, ccString, `Manuscript Submitted`, successfulSubmissionEmailTemplate(resp._id));

    res.status(201).json({ submissionId: resp._id });
  } catch (error) {
    console.error('Error submitting article:', error);
    res.status(500).json({ message: 'Error submitting article' });
  }
};

const getManuscripts = async (req, res) => {

  try {

    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401)
      return;

    // Query for manuscripts submitted by the extracted email
    const isAdmin = await isAdminByEmail(email)

    let manuscripts = [];
    if (!isAdmin) {
      manuscripts = await ManuscriptSubmissions.find({ submittedBy: email }, '_id title authors status').exec();
    }
    else {
      manuscripts = await ManuscriptSubmissions.find({}).exec();
    }    

    // Respond with the list of manuscripts
    res.status(200).json({ submissions: manuscripts, isAdmin: isAdmin });
  } catch (error) {
    console.error('Error fetching manuscripts:', error);
    res.status(500).json({ message: 'Error fetching manuscripts' });
  }
};

const updateManuscript = async (req, res) => {
  try {

    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401)
      return;
    // return error if not admin
    const isAdmin = await isAdminByEmail(email)
    if (!isAdmin) {
      res.status(401).json({ message: 'Unauthorized to update manuscript' });
      return;
    }

    const submissionId = req.params.id;
    const status = req.body.status;
    const result = await ManuscriptSubmissions.findByIdAndUpdate(submissionId, { status: status });
    // Send mail for updated status to the author
    await sendMail(email, '', `Submission Status Updated`, statusUpdateEmailTemplate(submissionId, status, result.title));

    res.status(200).json(result);
  }
  catch (error) {
    console.error('Error updating manuscript:', error);
    res.status(500).json({ message: 'Error updating manuscript' });
  }
}


module.exports = {
  get,
  articleSubmissionData,
  articleFileSubmission,
  getArticlesData,
  getDownloadData,
  getViewsData,
  displayArticle,
  downloadArticle,
  submitManuscript,
  getManuscripts,
  updateManuscript
};

async function isAdminByEmail(email) {
  return await AllowedEmailAddresses.findOne({ 'ManuscriptMailingList.Name': 'Editors' }, { 'ManuscriptMailingList.$': 1 })
    .then(doc => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        // Assuming there could be multiple matches and you want the first
        const emailIds = doc.ManuscriptMailingList[0].EmailIds;
        return emailIds.includes(email);
      }
      return false;
    });
}

const extractEmailFromToken = (req, res) => {
  const bearer = req.headers.authorization;
  if (!bearer) {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
  const bearerToken = bearer.split(' ');
  const token = bearerToken[1];
  try {
    // Decode token and extract email without secret
    var decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid authorization token. Please login' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authorization token. Please login again' });
  }
  // Extract email from token
  const email = decoded.payload.email;
  return email;
};