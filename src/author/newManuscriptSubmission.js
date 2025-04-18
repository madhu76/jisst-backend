const mongoose = require('mongoose');

const manuscriptSubmissionSchema = new mongoose.Schema({
  _id: {type:String, required:true},
  submittedBy: String,
  title: String,
  authors: String,
  abstract: String,
  keywords: String,
  status: String,
  articleUrl: String, // URL to the uploaded file on Cloudinary
  correspondingAuthorName: String,
  articleAuthorEmails: String,
  submissionFor: String,
  managingEditor: String,
  associateEditor: String,
  reviewUrls: [String],
  revisionUrls: [String],
  articleType: String,
  articleStream: String,
}, { timestamps: true });

const ManuscriptSubmissions = mongoose.model('ManuscriptSubmissions', manuscriptSubmissionSchema);

module.exports = ManuscriptSubmissions;
