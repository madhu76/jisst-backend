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
Your Manuscript No. is: ${submissionId}<br>
<br>
Regards,<br>
JISST Team`;
}

const statusUpdateEmailTemplate = (submissionId, status, title) => {
  return `Your manuscript with Manuscript No. ${submissionId} has been updated to status: ${status}.<br>
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
    const generateCustomId = async () => {
      //Get Latest _Id in the format <year>-<number> and increment the <number> by 1
      let year = new Date().getFullYear().toString().slice(-2);
      let latestResult = await ManuscriptSubmissions.findOne({}, { _id: 1 }, { sort: { createdAt: -1 } });
      let latestId = latestResult._id;
      let latestYear = latestId.split('-')[0];
      let latestNumber = latestId.split('-')[1];
      if (year !== latestYear) {
        return `${year}-0001`;
      }
      let newNumber = parseInt(latestNumber) + 1;
      return `${year}-${newNumber.toString().padStart(4, '0')}`;
    };

    const customId = await generateCustomId();

    // Create and save the article
    const newArticle = new ManuscriptSubmissions({
      _id: customId,
      submittedBy: email,
      title: req.body.title,
      authors: req.body.authors,
      abstract: req.body.abstract,
      keywords: req.body.keywords,
      status: 'Submission Received',
      articleUrl: result.url, // URL from Cloudinary
      correspondingAuthorName: req.body.correspondingAuthorName,
      articleAuthorEmails: req.body.articleAuthorEmails,
      submissionFor: req.body.submissionFor
    });

    const resp = await newArticle.save();

    const emailList = await AllowedEmailAddresses.findOne({ 'ManuscriptMailingList.Name': 'Editors' }, { 'ManuscriptMailingList.$': 1 })
      .then(doc => {
        if (doc && doc.ManuscriptMailingList.length > 0) {
          // Assuming there could be multiple matches and you want the first
          return emailIds = doc.ManuscriptMailingList[0].EmailIds;
        }
        return [];
      });

    // join email list as a comma separated string
    let ccString = emailList.join(', ');
    // append author emails to cc list if not empty or null
    if (resp.articleAuthorEmails)
      ccString += `, ${resp.articleAuthorEmails}`;

    await sendMail(email, ccString, `Manuscript Submitted`, successfulSubmissionEmailTemplate(resp._id));

    res.status(201).json({ submissionId: resp._id });
  } catch (error) {
    console.error('Error submitting article:', error);
    res.status(500).json({ message: 'Error submitting article' + error });
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
      manuscripts = await ManuscriptSubmissions.find({ submittedBy: email }).exec();
      let coAuthorManuscripts = await ManuscriptSubmissions.find({
        articleAuthorEmails: {
          $regex: new RegExp(`\\b${email}\\b`, 'i')
        }
      }, '_id title authors status submissionFor').exec();

      manuscripts = manuscripts.concat(coAuthorManuscripts);
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
const submitRevision = async (req, res) => {
  try {

    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401)
      return;
    // return error if not author
    if (email != req.body.submittedBy) {
      res.status(401).json({ message: 'Unauthorized to submit revision' });
      return;
    }

    //Upload file to Cloudinary
    const revisionUploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ManuscriptSubmissions'
    });

    const submissionId = req.params.id;
    const result = await ManuscriptSubmissions.findByIdAndUpdate(submissionId, {  $push: { revisionUrls: revisionUploadResult.url } });

    // Send mail for updated status to the editor
    const emailList = await AllowedEmailAddresses.findOne({ 'ManuscriptMailingList.Name': 'Editors' }, { 'ManuscriptMailingList.$': 1 })
    .then(doc => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        // Assuming there could be multiple matches and you want the first
        return emailIds = doc.ManuscriptMailingList[0].EmailIds;
      }
      return [];
    });

    const toString = emailList.join(', ');

    await sendMail(toString, email, `Revision Submitted`, `Revision for Manuscript No. ${submissionId} has been submitted by the author. Please review the revision.`);
    res.status(200).json(result);

  }
  catch (error) {
    console.error('Error submitting article:', error);
    res.status(500).json({ message: 'Error submitting article' + error });
  }
}


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
    let result = null;
    if (status === 'Under Revision') {
      const reviewUrls = [];
      // Loop thorough req.files and upload each file to Cloudinary and wait for the entire process to complete
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'ManuscriptSubmissions'
        });
        reviewUrls.push(uploadResult.url);
      }

      result = await ManuscriptSubmissions.findByIdAndUpdate(submissionId, { status: status, $push: { reviewUrls: reviewUrls } });
    }
    else {
      result = await ManuscriptSubmissions.findByIdAndUpdate(submissionId, { status: status });
    }

    // Send mail for updated status to the author
    const emailList = await AllowedEmailAddresses.findOne({ 'ManuscriptMailingList.Name': 'Editors' }, { 'ManuscriptMailingList.$': 1 })
      .then(doc => {
        if (doc && doc.ManuscriptMailingList.length > 0) {
          // Assuming there could be multiple matches and you want the first
          return emailIds = doc.ManuscriptMailingList[0].EmailIds;
        }
        return [];
      });
    let ccString = emailList.join(', ');
    // append author emails to cc list if not empty or null
    if (result.articleAuthorEmails)
      ccString += `, ${result.articleAuthorEmails}`;

    await sendMail(result.submittedBy, ccString, `Submission Status Updated`, statusUpdateEmailTemplate(submissionId, status, result.title));

    res.status(200).json(result);
  }
  catch (error) {
    console.error('Error updating manuscript:', error);
    res.status(500).json({ message: 'Error updating manuscript' + error });
  }
}

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


// Post Calls for Admin

const newsubmissionData = async (req, res, next) => {

  try {
    req.body.ref_id = req.userId;
    this.id = req.userId;
    console.log(`ref id` + req.body.ref_id);

    let newsubmission = new Newsubmission(req.body);
    console.log(`data` + newsubmission);

    newsubmission.save((err, newuser) => {
      if (err) {
        console.log(err)
        res.json({ success: false, msg: 'failed to register user' });
      }
      else {
        res.json({ success: true });
      }
    });
  } catch (error) {
    res.status(500);
    next(error);
  }

};


const newfilesubmissionData = async (req, res, next) => {

  try {
    req.body.ref_id = this.id;
    console.log(`ref id` + req.body.ref_id);
    let result;
    if (req.file)
      result = await cloudinary.uploader.upload(req.file.path);
    else
      console.log(`upload plzzz`);
    console.log(`result` + result);
    delete req.body.image;
    let newfilesubmission = new NewFilesubmission({
      avatar: result.secure_url,
      cloudinary_id: result.public_id,
      ref_id: this.id,
    });
    console.log(`data` + newfilesubmission);
    newfilesubmission.save((err, newuser) => {
      if (err) {
        console.log(err)
        res.json({ success: false, msg: 'failed to register user' });
      }
      else {
        res.json({ success: true });
      }
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

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
  submitRevision,
  getManuscripts,
  updateManuscript,
  newsubmissionData,
  newfilesubmissionData
};
