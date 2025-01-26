const Articlesubmission = require("./articlesubmission");
const ArticleFileSubmission = require("./articlefilesubmission");
const cloudinary = require("../utilities/cloudinary");
const ManuscriptSubmissions = require("./newManuscriptSubmission");
const AllowedEmailAddresses = require("./allowedEmails");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utilities/emailService");

const get = (req, res) => {
  res.json({
    message: "Hello Author! 🔐",
  });
};

const successfulSubmissionEmailTemplate = (
  submissionId,
  title,
  authorNames,
  correspondingAuthorName
) => {
  return `Dear Authors,
<br>
The following manuscript has been submitted successfully for possible publication in JISST!
<br>
TITLE: ${title} 
<br>
AUTHORS: ${correspondingAuthorName},${authorNames}
<br>
If any of you desire that your name should not be associated with this submission please e-mail the concern to : jisst@researchfoundation.in
<br>
You can track the status of your manuscript from https://www.jisst.com/my-submissions.
<br>
Your Manuscript No. is: ${submissionId}
<br>
<br>
Regards,
<br>
JISST Editorial Team`;
};

const underRevisionSubmissionEmailTemplate = (
  submissionId,
  title,
  authorNames,
  correspondingAuthorName
) => {
  return `Dear Authors:<br>
The review process on your submission for possible publication in the Journal of Innovation Sciences and Sustainable Technologies is now complete. 
Following the reviews the Editorial Team recommends the revision of this manuscript. Please turn in your revision with a statement of point-by-point replies to the suggestions in the review reports within 15 days. 
You may upload the revised version again to the Editorial Management System.<br>
You may download the reviews by following the link: https://www.jisst.com/my-submissions<br>
Title: ${title} <br>
Manuscript No.: ${submissionId}<br>
Sincerely,<br>
Editorial Team, JISST
`;
};

const rejectedSubmissionEmailTemplate = (
  submissionId,
  title,
  authorNames,
  correspondingAuthorName
) => {
  return `Dear Authors:<br>
The review process on your submission titled “${title}”, for possible publication in the Journal of Innovation Sciences and Sustainable Technologies (JISST), is now complete. 
The review reports may be downloaded by following the link: , which we believe will be useful to improve the content of your manuscript.<br>
As you may notice that all the reviewers have done a great job in reviewing this manuscript and have recommended against the publication of your paper in this journal. 
Accordingly, we must reject this manuscript for publication.<br>
We thank you for thinking of JISST for publication of your research and we hope to receive your future submissions to this journal.<br>
<br>
Sincerely,<br>
Editorial TEAM, JISST
`;
};

const acceptedSubmissionEmailTemplate = (
  submissionId,
  title,
  authorNames,
  correspondingAuthorName
) => {
  return `Dear Authors:<br>
Upon the recommendation of the review committee, we have pleasure in communicating the acceptance of your manuscript titled “${title}”, for publication in the Journal of Innovation Sciences and Sustainable Technologies. 
This journal requires papers to be type set in LaTex format. For your guidance, Template/Sample files are attached to this mail. Please follow the text width and height specifications as suggested in the Template/Sample files.
Please return your Latex, pdf files along with clean and quality figures and tables to the below E-mail address no later than 2 weeks from the date of receipt of this communication.<br>
Also please download the appropriate copyright transfer statement and return the duly signed document.<br>
If you want to place your article in open access category, please download the form <a href='https://res.cloudinary.com/jisst/image/upload/v1722785715/Copyright%20Docs%20for%20Accepted%20Emails/Copyright-OA.pdf'>Copyright-OA.pdf</a>. Open access category articles have a very nominal fee payable by the Authors/Institutions/Research Funding Agencies. 
For the open access publication charges please write to the below mentioned E-mail. The authors of open access publications enjoy special privileges as explained in the copyright statement. 
Otherwise, use the form <a href='https://res.cloudinary.com/jisst/image/upload/v1722785590/Copyright%20Docs%20for%20Accepted%20Emails/Copyright-General.pdf'>Copyright-General.pdf</a>.<br>
Please E-mail all these documents to: jisst@researchfoundation.in and sharanjeet@hau.ac.in<br>
<br>
Sincerely,<br>
Editorial TEAM, JISST
<br><br>
Attachments:<br>
1. Sample.pdf: <a href='https://res.cloudinary.com/jisst/image/upload/v1722785817/Copyright%20Docs%20for%20Accepted%20Emails/sample.pdf'>Sample.pdf</a><br>
2. Sample.tex: <a href='https://res.cloudinary.com/jisst/raw/upload/v1722785869/Copyright%20Docs%20for%20Accepted%20Emails/sample.tex'>Sample.tex</a><br>
3. Template.pdf: <a href='https://res.cloudinary.com/jisst/image/upload/v1722786007/Copyright%20Docs%20for%20Accepted%20Emails/template.pdf'>Template.pdf</a><br>
4. Template.tex: <a href='https://res.cloudinary.com/jisst/raw/upload/v1722786008/Copyright%20Docs%20for%20Accepted%20Emails/template.tex'>Template.tex</a><br>
`;
};

const statusUpdateEmailTemplate = (submissionId, status, title, newReviews) => {
  return `Dear Authors,
<br>Your manuscript with Manuscript No. ${submissionId} has been updated.
<br>
Title: ${title}
<br>
Status: ${status}
${
  newReviews
    ? "<br>New reviews have been submitted. Please login to view the reviews."
    : ""
}
<br>
You can track the status of your manuscript from https://www.jisst.com/my-submissions.<br>
<br>
<br>
Regards,
<br>
JISST Editorial Team`;
};

const editorUpdatedEmailTemplate = (submissionId, managingEditor) => {
  return `Greetings of the day!<br>
  You have been assigned as the Associate Editor for the Manuscript No. ${submissionId} by ${managingEditor}.<br>
  Please login to the system and do the needful.<br>
  Link: https://www.jisst.com/my-submissions<br>
  <br>
  Regards,<br>
  JISST Editorial Team`;
};

const displayArticle = async (req, res, next) => {
  try {
    const article = await Articlesubmission.findOne(
      { item_id: req.params.id },
      "-fileUrl"
    );
    let view = article.views;
    Articlesubmission.updateOne(
      { item_id: req.params.id },
      { $set: { views: view + 1 } },
      function (err, results) {
        console.log(results.result);
      }
    );
    const updatedArticle = await Articlesubmission.findOne(
      { item_id: req.params.id },
      "-fileUrl"
    );
    console.log("find new article data " + updatedArticle);
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
    Articlesubmission.updateOne(
      { item_id: req.params.id },
      { $set: { downloads: download + 1 } },
      function (err, results) {
        console.log(results.result);
      }
    );
    const updatedArticle = await Articlesubmission.findOne(
      { item_id: req.params.id },
      "-fileUrl"
    );
    console.log("download Article " + updatedArticle);
    res.json(JSON.stringify(updatedArticle));
  } catch (error) {
    res.status(500);
    next(error);
  }
};

const getArticlesData = async (req, res, next) => {
  try {
    const articles = await Articlesubmission.find({}, "-fileUrl");
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
    const articles = await Articlesubmission.find({}, "-fileUrl").sort({
      downloads: -1,
      item_id: 1,
    });
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
    const articles = await Articlesubmission.find({}, "-fileUrl").sort({
      views: -1,
      item_id: 1,
    });
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
        console.log(err);
        res.json({ success: false, msg: "failed to register user" });
      } else {
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
        folder: "Articles",
      });
    else console.log(`upload plzzz`);
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
        console.log(err);
        res.json({ success: false, msg: "failde to uplad file" });
      } else {
        const update = {
          fileId: result._id,
          fileUrl: result.avatar,
        };
        Articlesubmission.findOneAndUpdate(
          { _id: result.formId },
          { $set: update },
          { new: true },
          (err, doc) => {
            if (err) {
              console.log("error error error error", err);
            } else {
              console.log(doc.fileId, " ", doc.fileUrl);
            }
          }
        );
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
    if (res.statusCode === 401) return;
    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "ManuscriptSubmissions",
    });
    const generateCustomId = async () => {
      //Get Latest _Id in the format <year>-<number> and increment the <number> by 1
      let year = new Date().getFullYear().toString().slice(-2);
      let latestResult = await ManuscriptSubmissions.findOne(
        {},
        { _id: 1 },
        { sort: { createdAt: -1 } }
      );
      let latestId = latestResult._id;
      let latestYear = latestId.split("-")[0];
      let latestNumber = latestId.split("-")[1];
      if (year !== latestYear) {
        return `${year}-0001`;
      }
      let newNumber = parseInt(latestNumber) + 1;
      return `${year}-${newNumber.toString().padStart(4, "0")}`;
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
      status: "Submission Received",
      articleUrl: result.url, // URL from Cloudinary
      correspondingAuthorName: req.body.correspondingAuthorName,
      articleAuthorEmails: req.body.articleAuthorEmails,
      submissionFor: req.body.submissionFor,
      articleType: req.body.articleType,
      articleStream: req.body.articleStream,
      managingEditor: getManagingEditorFromStream(req.body.articleStream),
    });

    const resp = await newArticle.save();

    const emailList = await AllowedEmailAddresses.findOne(
      { "ManuscriptMailingList.Name": "EmailList" },
      { "ManuscriptMailingList.$": 1 }
    ).then((doc) => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        // Assuming there could be multiple matches and you want the first
        return (emailIds = doc.ManuscriptMailingList[0].EmailIds);
      }
      return [];
    });

    // join email list as a comma separated string
    let ccString = emailList.join(", ");
    // append author emails to cc list if not empty or null
    if (resp.articleAuthorEmails) ccString += `, ${resp.articleAuthorEmails}`;

    await sendMail(
      email,
      ccString,
      `Manuscript Submitted`,
      successfulSubmissionEmailTemplate(
        resp._id,
        resp.title,
        resp.authors,
        resp.correspondingAuthorName
      )
    );

    res.status(201).json({ submissionId: resp._id });
  } catch (error) {
    console.error("Error submitting article:", error);
    res.status(500).json({ message: "Error submitting article" + error });
  }
};

const getManuscripts = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;

    // Query for manuscripts submitted by the extracted email
    const isAdmin = await isAdminByEmail(email);
    const isAssociateEditor = await isAssociateEditorByEmail(email);
    let manuscripts = [];

    if (!isAdmin && !isAssociateEditor) {
      manuscripts = await ManuscriptSubmissions.find({
        submittedBy: email,
      }).exec();
      let coAuthorManuscripts = await ManuscriptSubmissions.find(
        {
          articleAuthorEmails: {
            $regex: new RegExp(`\\b${email}\\b`, "i"),
          },
        },
        "_id title authors status submissionFor"
      ).exec();

      manuscripts = manuscripts.concat(coAuthorManuscripts);
    } else if (isAdmin) {
      manuscripts = await ManuscriptSubmissions.find({}).exec();
    } else if (isAssociateEditor) {
      manuscripts = await ManuscriptSubmissions.find({
        associateEditor: email,
      }).exec();
    }

    // Respond with the list of manuscripts
    res.status(200).json({ submissions: manuscripts, isAdmin: isAdmin, isAssociateEditor: isAssociateEditor });
  } catch (error) {
    console.error("Error fetching manuscripts:", error);
    res.status(500).json({ message: "Error fetching manuscripts" });
  }
};
const submitRevision = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;
    // return error if not author
    if (email != req.body.submittedBy) {
      res.status(401).json({ message: "Unauthorized to submit revision" });
      return;
    }

    //Upload file to Cloudinary
    const revisionUploadResult = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: "ManuscriptSubmissions",
      }
    );

    const submissionId = req.params.id;
    const result = await ManuscriptSubmissions.findByIdAndUpdate(submissionId, {
      $push: { revisionUrls: revisionUploadResult.url },
    });

    // Send mail for updated status to the editor
    const emailList = await AllowedEmailAddresses.findOne(
      { "ManuscriptMailingList.Name": "EmailList" },
      { "ManuscriptMailingList.$": 1 }
    ).then((doc) => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        // Assuming there could be multiple matches and you want the first
        return (emailIds = doc.ManuscriptMailingList[0].EmailIds);
      }
      return [];
    });

    const toString = emailList.join(", ");

    await sendMail(
      toString,
      email,
      `Revision Submitted`,
      `Revision for Manuscript No. ${submissionId} has been submitted by the author. Please review the revision.`
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error submitting article:", error);
    res.status(500).json({ message: "Error submitting article" + error });
  }
};

const getAssociateEditors = async (req, res) => {
  try {   
    var associateEditors = await AllowedEmailAddresses.findOne(
      { "ManuscriptMailingList.Name": "AssociateEditors" },
      { "ManuscriptMailingList.Type": "All" },
      { "ManuscriptMailingList.$": 1 }
    ).then((doc) => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        // Assuming there could be multiple matches and you want the first
        return (emailIds = doc.ManuscriptMailingList[0].EmailIds);
      }
      return [];
    });
    // return associateEditors
    res.status(200).json({ associateEditors: associateEditors });
  } catch (error) {
    console.error("Error updating manuscript:", error);
    res
      .status(500)
      .json({ message: "Error getting associate editors" + error });
  }
};

const updateEditorsInManuscript = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;
    // return error if not admin
    const isAdmin = await isAdminByEmail(email);
    if (!isAdmin) {
      res.status(401).json({ message: "Unauthorized to update manuscript" });
      return;
    }

    const submissionId = req.params.id;
    const managingEditor = email;
    const associateEditor = req.body.associateEditor;
    const result = await ManuscriptSubmissions.findByIdAndUpdate(submissionId, {
      managingEditor: managingEditor,
      associateEditor: associateEditor,
    });
    await sendMail(
      associateEditor,
      managingEditor,
      `Action Required: Manuscript Assigned`,
      editorUpdatedEmailTemplate(submissionId, associateEditor, managingEditor)
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating manuscript:", error);
    res.status(500).json({ message: "Error updating manuscript" + error });
  }
};

const updateManuscript = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;
    // return error if not admin
    const isAdmin = await isAdminByEmail(email);
    const isAssociateEditor = await isAssociateEditorByEmail(email);
    if (!isAdmin && !isAssociateEditor) {
      res.status(401).json({ message: "Unauthorized to update manuscript" });
      return;
    }

    const submissionId = req.params.id;
    const status = req.body.status;
    let result = null;
    const reviewUrls = [];
    let newReviews = false;
    // Loop thorough req.files and upload each file to Cloudinary and wait for the entire process to complete
    for (let i = 0; i < req.files?.length; i++) {
      newReviews = true;
      const file = req.files[i];
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "ManuscriptSubmissions",
      });
      reviewUrls.push(uploadResult.url);
    }

    result = await ManuscriptSubmissions.findByIdAndUpdate(submissionId, {
      status: status,
      $push: { reviewUrls: reviewUrls },
    });

    // Send mail for updated status to the author
    const emailList = await AllowedEmailAddresses.findOne(
      { "ManuscriptMailingList.Name": "EmailList" },
      { "ManuscriptMailingList.$": 1 }
    ).then((doc) => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        // Assuming there could be multiple matches and you want the first
        return (emailIds = doc.ManuscriptMailingList[0].EmailIds);
      }
      return [];
    });
    let ccString = emailList.join(", ") + `, ${email}`+`, sharanjeet@hau.ac.in`;
    // append author emails to cc list if not empty or null
    if (result.articleAuthorEmails)
      ccString += `, ${result.articleAuthorEmails}`;

    if (status === "Accepted") {
      await sendMail(
        result.submittedBy,
        ccString,
        `Submission Status Updated`,
        acceptedSubmissionEmailTemplate(
          submissionId,
          result.title,
          result.authors,
          result.correspondingAuthorName
        )
      );
    } else if (status === "Under Revision") {
      await sendMail(
        result.submittedBy,
        ccString,
        `Submission Status Updated`,
        underRevisionSubmissionEmailTemplate(
          submissionId,
          result.title,
          result.authors,
          result.correspondingAuthorName
        )
      );
    } else if (status === "Rejected") {
      await sendMail(
        result.submittedBy,
        ccString,
        `Submission Status Updated`,
        rejectedSubmissionEmailTemplate(
          submissionId,
          result.title,
          result.authors,
          result.correspondingAuthorName
        )
      );
    } else {
      await sendMail(
        result.submittedBy,
        ccString,
        `Submission Status Updated`,
        statusUpdateEmailTemplate(
          submissionId,
          status,
          result.title,
          newReviews
        )
      );
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating manuscript:", error);
    res.status(500).json({ message: "Error updating manuscript" + error });
  }
};

async function isAdminByEmail(email) {
  return await AllowedEmailAddresses.findOne(
    { "ManuscriptMailingList.Name": "AdminList" },
    { "ManuscriptMailingList.$": 1 }
  ).then((doc) => {
    if (doc && doc.ManuscriptMailingList.length > 0) {
      // Assuming there could be multiple matches and you want the first
      const emailIds = doc.ManuscriptMailingList[0].EmailIds;
      return emailIds.includes(email);
    }
    return false;
  });
}

async function isAssociateEditorByEmail(email) {
  return await AllowedEmailAddresses.findOne(
    { "ManuscriptMailingList.Name": "AssociateEditors" },
    { "ManuscriptMailingList.$": 1 }
  ).then((doc) => {
    if (doc && doc.ManuscriptMailingList.length > 0) {
      const emailIds = doc.ManuscriptMailingList[0].EmailIds.map((emailId) => emailId.email);
      return emailIds.includes(email);
    }
    return false;
  });
}

const extractEmailFromToken = (req, res) => {
  const bearer = req.headers.authorization;
  if (!bearer) {
    return res
      .status(401)
      .json({ message: "Authorization header is required" });
  }
  const bearerToken = bearer.split(" ");
  const token = bearerToken[1];
  try {
    // Decode token and extract email without secret
    var decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      return res
        .status(401)
        .json({ message: "Invalid authorization token. Please login" });
    }
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid authorization token. Please login again" });
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
        console.log(err);
        res.json({ success: false, msg: "failed to register user" });
      } else {
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
    if (req.file) result = await cloudinary.uploader.upload(req.file.path);
    else console.log(`upload plzzz`);
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
        console.log(err);
        res.json({ success: false, msg: "failed to register user" });
      } else {
        res.json({ success: true });
      }
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

const getManagingEditorFromStream = (stream) => {
  switch (stream) {
    case "Computer Science & Information Technology":
      return "madhu2376@gmail.com";
    case "Mathematical Modeling & Simulation":
      return "madhu2376@gmail.com";
    default:
      return "madhu2376@gmail.com";
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
  submitRevision,
  getManuscripts,
  updateManuscript,
  newsubmissionData,
  newfilesubmissionData,
  updateEditorsInManuscript,
  getAssociateEditors,
};
