const mongoose = require('mongoose');

const manuscriptSubmissionSchema = new mongoose.Schema({
  submittedBy: String,
  title: String,
  authors: String,
  abstract: String,
  keywords: String,
  status: String,
  articleUrl: String, // URL to the uploaded file on Cloudinary
  correspondingAuthorName: String,
  correspondingAuthorEmail: String,
  articleAuthorEmails: String,
  submissionFor: String
}, { timestamps: true });

const ManuscriptSubmissions = mongoose.model('ManuscriptSubmissions', manuscriptSubmissionSchema);

module.exports = ManuscriptSubmissions;
