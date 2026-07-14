const Articlesubmission = require("./articlesubmission");
const ArticleFileSubmission = require("./articlefilesubmission");
const cloudinary = require("../utilities/cloudinary");
const ManuscriptSubmissions = require("./newManuscriptSubmission");
const AllowedEmailAddresses = require("./allowedEmails");
const Stream = require("./streams");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utilities/emailService");
const telemetry = require("../utilities/telemetry");

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
Please E-mail all these documents to: jisst@researchfoundation.in<br>
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

const editorUpdatedEmailTemplate = (submissionId, associateEditor, managingEditor) => {
  return `Greetings of the day!<br>
  You have been assigned as the Associate Editor (${associateEditor}) for the Manuscript No. ${submissionId} by ${managingEditor}.<br>
  Please login to the system and do the needful.<br>
  Link: https://www.jisst.com/my-submissions<br>
  <br>
  Regards,<br>
  JISST Editorial Team`;
};

const editorUnassignedEmailTemplate = (submissionId) => {
  return `Dear Editor:<br>
  You have been unassigned from the manuscript No. ${submissionId} and are no longer responsible for processing this manuscript.<br>
  <br>
  Thanks!<br>
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
      managingEditor: await getManagingEditorFromStream(req.body.articleStream),
    });

    const resp = await newArticle.save();

    // join email list as a comma separated string
    let ccString = newArticle.managingEditor;
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

    telemetry.track("audit", {
      action: "manuscript_submitted",
      email,
      submissionId: resp._id,
      title: resp.title,
      articleStream: resp.articleStream,
    });

    res.status(201).json({ submissionId: resp._id });
  } catch (error) {
    console.error("Error submitting article:", error);
    telemetry.captureException(error, { tags: { action: "manuscript_submitted" } });
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
    const isAdmin = await isAdminByEmail(email);
    const isOriginalSubmitter = email === req.body.submittedBy;
    // return error if not the submitting author or an admin
    if (!isOriginalSubmitter && !isAdmin) {
      res.status(401).json({ message: "Unauthorized to submit revision" });
      return;
    }
    const submitterType = isOriginalSubmitter ? "the author" : "an admin";

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

    let toString = result?.managingEditor;
    if(result?.associateEditor) {
      toString = toString + ", " + result.associateEditor;
    }
    await sendMail(
      toString,
      email,
      `Revision Submitted`,
      `Revision for Manuscript No. ${submissionId} has been submitted by ${submitterType}. Please review the revision.`
    );
    telemetry.track("audit", {
      action: "revision_submitted",
      email,
      submissionId,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error submitting article:", error);
    telemetry.captureException(error, { tags: { action: "revision_submitted" } });
    res.status(500).json({ message: "Error submitting article" + error });
  }
};

const getAssociateEditors = async (req, res) => {
  try {   
    var associateEditors = await AllowedEmailAddresses.findOne(
      { "ManuscriptMailingList.Name": "AssociateEditors" },
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

const getManagingEditors = async (req, res) => {
  try {
    var managingEditors = await AllowedEmailAddresses.findOne(
      { "ManuscriptMailingList.Name": "ManagingEditors" },
      { "ManuscriptMailingList.$": 1 }
    ).then((doc) => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        return doc.ManuscriptMailingList[0].EmailIds;
      }
      return [];
    });
    res.status(200).json({ managingEditors: managingEditors });
  } catch (error) {
    console.error("Error getting managing editors:", error);
    res
      .status(500)
      .json({ message: "Error getting managing editors" + error });
  }
};

const DEFAULT_STREAMS = [
  "Computer Science, Information Technology, Robotics",
  "Mathematics, Modeling, Simulations",
  "Life Sciences, Bio Informatics, Bio Technology",
  "Pedagogies and Techniques",
  "Indian Knowledge System- Innovations",
  "Science News and Notes",
  "Nanochemistry for a Sustainable Future: Innovations in Material Design",
  "Edge Intelligence for Internet of Things - Algorithms, Architectures and Applications",
];

const getStreams = async (req, res) => {
  try {
    const docs = await Stream.find({}, { name: 1, _id: 0 }).exec();
    const streams = docs.map((d) => d.name);
    res.status(200).json({
      streams: streams.length > 0 ? streams : DEFAULT_STREAMS,
    });
  } catch (error) {
    console.error("Error getting streams:", error);
    res.status(500).json({ message: "Error getting streams: " + error });
  }
};

const addStream = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;

    // Only admins can add streams
    const isAdmin = await isAdminByEmail(email);
    if (!isAdmin) {
      res.status(401).json({ message: "Unauthorized to add stream" });
      return;
    }

    const stream = (req.body.stream || "").trim();
    if (!stream) {
      res.status(400).json({ message: "Stream name is required" });
      return;
    }

    // Seed the built-in defaults on first use so they aren't lost.
    const count = await Stream.countDocuments();
    if (count === 0) {
      await Stream.insertMany(DEFAULT_STREAMS.map((name) => ({ name })));
    }

    // Case-insensitive duplicate check
    const existingStreams = await Stream.find({}, { name: 1, _id: 0 }).exec();
    if (existingStreams.some((s) => s.name.toLowerCase() === stream.toLowerCase())) {
      res.status(409).json({ message: "This stream already exists" });
      return;
    }

    await Stream.create({ name: stream });

    telemetry.track("audit", { action: "stream_added", email, stream });
    res.status(201).json({ message: "Stream added successfully", stream });
  } catch (error) {
    console.error("Error adding stream:", error);
    telemetry.captureException(error, { tags: { action: "stream_added" } });
    res.status(500).json({ message: "Error adding stream: " + error });
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
    // Admins may explicitly assign a managing editor; otherwise default to the
    // acting admin's email (preserves previous behaviour).
    const managingEditor = req.body.managingEditor || email;
    const associateEditor =
      typeof req.body.associateEditor === "string"
        ? req.body.associateEditor.trim()
        : "";
    const result = await ManuscriptSubmissions.findByIdAndUpdate(submissionId, {
      managingEditor: managingEditor,
      associateEditor: associateEditor,
    });
    if (!result) {
      res.status(404).json({ message: "Manuscript not found" });
      return;
    }
    const normalizeEmail = (value) =>
      typeof value === "string" ? value.trim().toLowerCase() : "";
    const previousAssociateEditor = result.associateEditor?.trim() || "";
    const isAssociateEditorChanged =
      normalizeEmail(previousAssociateEditor) !== normalizeEmail(associateEditor);

    if (previousAssociateEditor && isAssociateEditorChanged) {
      await sendMail(
        previousAssociateEditor,
        managingEditor,
        `Associate Editor Assignment Removed`,
        editorUnassignedEmailTemplate(submissionId)
      );
    }

    if (associateEditor && isAssociateEditorChanged) {
      await sendMail(
        associateEditor,
        managingEditor,
        `Action Required: Manuscript Assigned`,
        editorUpdatedEmailTemplate(submissionId, associateEditor, managingEditor)
      );
    }
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
    let ccString = email + `, ${result?.managingEditor}`;
    // append associate editor to cc list if not empty or null
    if (result?.associateEditor) 
    {
        ccString += `, ${result.associateEditor}`;
    }

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
    telemetry.track("audit", {
      action: "manuscript_status_updated",
      email,
      submissionId,
      status,
      newReviews,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating manuscript:", error);
    telemetry.captureException(error, { tags: { action: "manuscript_status_updated" } });
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

const DEFAULT_MANAGING_EDITOR = "madhu2376@gmail.com";

const getManagingEditorFromStream = async (stream) => {
  try {
    const managingEditors = await AllowedEmailAddresses.findOne(
      { "ManuscriptMailingList.Name": "ManagingEditors" },
      { "ManuscriptMailingList.$": 1 }
    ).then((doc) => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        return doc.ManuscriptMailingList[0].EmailIds;
      }
      return [];
    });
    const editor = managingEditors.find(
      (e) => Array.isArray(e.streams) && e.streams.includes(stream)
    );
    return editor ? editor.email : DEFAULT_MANAGING_EDITOR;
  } catch (error) {
    console.error("Error resolving managing editor from stream:", error);
    return DEFAULT_MANAGING_EDITOR;
  }
}

const getArchivedManuscripts = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;

    // Check if user is admin
    const isAdmin = await isAdminByEmail(email);
    if (!isAdmin) {
      res.status(401).json({ message: "Unauthorized to view archived manuscripts" });
      return;
    }

    // Get all accepted manuscripts
    const manuscripts = await ManuscriptSubmissions.find({ status: "Accepted" }).exec();
    res.status(200).json({ archivedManuscripts: manuscripts });
  } catch (error) {
    console.error("Error fetching archived manuscripts:", error);
    res.status(500).json({ message: "Error fetching archived manuscripts" + error });
  }
};

const updateArchiveDetails = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;

    // Check if user is admin
    const isAdmin = await isAdminByEmail(email);
    if (!isAdmin) {
      res.status(401).json({ message: "Unauthorized to update archive details" });
      return;
    }

    const submissionId = req.params.id;
    const { volume, issue } = req.body;

    // Validate that volume and issue are provided
    if (!volume || !issue) {
      res.status(400).json({ message: "Volume and issue are required" });
      return;
    }

    // Find the manuscript and check if it's accepted
    const manuscript = await ManuscriptSubmissions.findById(submissionId);
    if (!manuscript) {
      res.status(404).json({ message: "Manuscript not found" });
      return;
    }

    if (manuscript.status !== "Accepted") {
      res.status(400).json({ message: "Only accepted manuscripts can be archived with volume and issue" });
      return;
    }

    // Update volume and issue
    const result = await ManuscriptSubmissions.findByIdAndUpdate(
      submissionId,
      { volume: volume, issue: issue },
      { new: true }
    );

    res.status(200).json({ message: "Archive details updated successfully", manuscript: result });
  } catch (error) {
    console.error("Error updating archive details:", error);
    res.status(500).json({ message: "Error updating archive details: " + error });
  }
};

const updateManuscriptNumber = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;

    // Only admins can change the manuscript number
    const isAdmin = await isAdminByEmail(email);
    if (!isAdmin) {
      res.status(401).json({ message: "Unauthorized to change manuscript number" });
      return;
    }

    const currentId = req.params.id;
    const newId = (req.body.newId || "").trim();

    // Validate format YY-NNNN (e.g. 25-0001)
    if (!/^\d{2}-\d{4}$/.test(newId)) {
      res.status(400).json({
        message: "Manuscript number must be in the format YY-NNNN (e.g. 25-0001)",
      });
      return;
    }
    if (newId === currentId) {
      res.status(400).json({ message: "New manuscript number is the same as the current one" });
      return;
    }

    // Ensure the current manuscript exists
    const existingDoc = await ManuscriptSubmissions.findById(currentId).lean();
    if (!existingDoc) {
      res.status(404).json({ message: "Manuscript not found" });
      return;
    }

    // Ensure the target number is not already taken
    const conflict = await ManuscriptSubmissions.findById(newId).lean();
    if (conflict) {
      res.status(409).json({ message: `Manuscript number ${newId} already exists` });
      return;
    }

    // _id is immutable in MongoDB, so clone the document under the new _id
    // (raw insert preserves the original createdAt/updatedAt), then delete the old one.
    const clone = { ...existingDoc, _id: newId };
    await ManuscriptSubmissions.collection.insertOne(clone);
    await ManuscriptSubmissions.deleteOne({ _id: currentId });

    telemetry.track("audit", {
      action: "manuscript_number_changed",
      email,
      oldId: currentId,
      newId,
    });

    res.status(200).json({
      message: "Manuscript number updated successfully",
      oldId: currentId,
      newId,
    });
  } catch (error) {
    console.error("Error updating manuscript number:", error);
    telemetry.captureException(error, { tags: { action: "manuscript_number_changed" } });
    res.status(500).json({ message: "Error updating manuscript number: " + error });
  }
};

const addAssociateEditor = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;

    // Only admins can add associate editors
    const isAdmin = await isAdminByEmail(email);
    if (!isAdmin) {
      res.status(401).json({ message: "Unauthorized to add associate editor" });
      return;
    }

    const { name, email: editorEmail, streams } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      res.status(400).json({ message: "Name is required" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editorEmail || !emailRegex.test(editorEmail)) {
      res.status(400).json({ message: "A valid email is required" });
      return;
    }
    if (!Array.isArray(streams) || streams.length === 0) {
      res.status(400).json({ message: "At least one stream is required" });
      return;
    }

    // Reject duplicate email
    const existing = await AllowedEmailAddresses.findOne(
      { "ManuscriptMailingList.Name": "AssociateEditors" },
      { "ManuscriptMailingList.$": 1 }
    ).then((doc) => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        return doc.ManuscriptMailingList[0].EmailIds.some(
          (e) => e.email === editorEmail
        );
      }
      return false;
    });
    if (existing) {
      res.status(409).json({ message: "An associate editor with this email already exists" });
      return;
    }

    const newEditor = {
      name: name.trim(),
      email: editorEmail.trim(),
      streams: streams,
    };

    await AllowedEmailAddresses.findOneAndUpdate(
      { "ManuscriptMailingList.Name": "AssociateEditors" },
      { $push: { "ManuscriptMailingList.$.EmailIds": newEditor } }
    );

    telemetry.track("audit", {
      action: "associate_editor_added",
      email,
      editorEmail: newEditor.email,
    });

    res.status(201).json({ message: "Associate editor added successfully", editor: newEditor });
  } catch (error) {
    console.error("Error adding associate editor:", error);
    telemetry.captureException(error, { tags: { action: "associate_editor_added" } });
    res.status(500).json({ message: "Error adding associate editor: " + error });
  }
};

const addManagingEditor = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;

    // Only admins can add managing editors
    const isAdmin = await isAdminByEmail(email);
    if (!isAdmin) {
      res.status(401).json({ message: "Unauthorized to add managing editor" });
      return;
    }

    const { name, email: editorEmail, streams } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      res.status(400).json({ message: "Name is required" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editorEmail || !emailRegex.test(editorEmail)) {
      res.status(400).json({ message: "A valid email is required" });
      return;
    }
    if (!Array.isArray(streams) || streams.length === 0) {
      res.status(400).json({ message: "At least one stream is required" });
      return;
    }

    // Load existing managing editors (null means the list doesn't exist yet)
    const existingList = await AllowedEmailAddresses.findOne(
      { "ManuscriptMailingList.Name": "ManagingEditors" },
      { "ManuscriptMailingList.$": 1 }
    ).then((doc) => {
      if (doc && doc.ManuscriptMailingList.length > 0) {
        return doc.ManuscriptMailingList[0].EmailIds;
      }
      return null;
    });
    const currentEditors = existingList || [];

    // Reject duplicate email
    if (currentEditors.some((e) => e.email === editorEmail.trim())) {
      res.status(409).json({ message: "A managing editor with this email already exists" });
      return;
    }

    // Enforce one managing editor per stream
    const takenStream = streams.find((stream) =>
      currentEditors.some(
        (e) => Array.isArray(e.streams) && e.streams.includes(stream)
      )
    );
    if (takenStream) {
      res.status(409).json({
        message: `The stream "${takenStream}" already has a managing editor assigned`,
      });
      return;
    }

    const newEditor = {
      name: name.trim(),
      email: editorEmail.trim(),
      streams: streams,
    };

    if (existingList === null) {
      // Managing editors list doesn't exist yet: create it on the main document.
      await AllowedEmailAddresses.findOneAndUpdate(
        { "ManuscriptMailingList.Name": "AdminList" },
        {
          $push: {
            ManuscriptMailingList: {
              Name: "ManagingEditors",
              EmailIds: [newEditor],
            },
          },
        }
      );
    } else {
      await AllowedEmailAddresses.findOneAndUpdate(
        { "ManuscriptMailingList.Name": "ManagingEditors" },
        { $push: { "ManuscriptMailingList.$.EmailIds": newEditor } }
      );
    }

    telemetry.track("audit", {
      action: "managing_editor_added",
      email,
      editorEmail: newEditor.email,
    });

    res.status(201).json({ message: "Managing editor added successfully", editor: newEditor });
  } catch (error) {
    console.error("Error adding managing editor:", error);
    telemetry.captureException(error, { tags: { action: "managing_editor_added" } });
    res.status(500).json({ message: "Error adding managing editor: " + error });
  }
};

const deleteReview = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;

    // Only admins can delete reviews
    const isAdmin = await isAdminByEmail(email);
    if (!isAdmin) {
      res.status(401).json({ message: "Unauthorized to delete review" });
      return;
    }

    const submissionId = req.params.id;
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ message: "Review url is required" });
      return;
    }

    const result = await ManuscriptSubmissions.findByIdAndUpdate(
      submissionId,
      { $pull: { reviewUrls: url } },
      { new: true }
    );
    if (!result) {
      res.status(404).json({ message: "Manuscript not found" });
      return;
    }

    telemetry.track("audit", {
      action: "review_deleted",
      email,
      submissionId,
      url,
    });

    res.status(200).json({ message: "Review deleted successfully", manuscript: result });
  } catch (error) {
    console.error("Error deleting review:", error);
    telemetry.captureException(error, { tags: { action: "review_deleted" } });
    res.status(500).json({ message: "Error deleting review: " + error });
  }
};

const deleteRevision = async (req, res) => {
  try {
    const email = extractEmailFromToken(req, res);
    if (res.statusCode === 401) return;

    // Only admins can delete revisions
    const isAdmin = await isAdminByEmail(email);
    if (!isAdmin) {
      res.status(401).json({ message: "Unauthorized to delete revision" });
      return;
    }

    const submissionId = req.params.id;
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ message: "Revision url is required" });
      return;
    }

    const result = await ManuscriptSubmissions.findByIdAndUpdate(
      submissionId,
      { $pull: { revisionUrls: url } },
      { new: true }
    );
    if (!result) {
      res.status(404).json({ message: "Manuscript not found" });
      return;
    }

    telemetry.track("audit", {
      action: "revision_deleted",
      email,
      submissionId,
      url,
    });

    res.status(200).json({ message: "Revision deleted successfully", manuscript: result });
  } catch (error) {
    console.error("Error deleting revision:", error);
    telemetry.captureException(error, { tags: { action: "revision_deleted" } });
    res.status(500).json({ message: "Error deleting revision: " + error });
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
  newfilesubmissionData,
  updateEditorsInManuscript,
  getAssociateEditors,
  getManagingEditors,
  getStreams,
  addStream,
  getArchivedManuscripts,
  updateArchiveDetails,
  updateManuscriptNumber,
  addAssociateEditor,
  addManagingEditor,
  deleteReview,
  deleteRevision,
};
