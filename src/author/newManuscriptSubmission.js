const mongoose = require('mongoose');

const manuscriptSubmissionSchema = new mongoose.Schema({
  submittedBy: String,
  title: String,
  authors: String,
  abstract: String,
  keywords: String,
  status: String,
  articleUrl: String // URL to the uploaded file on Cloudinary
}, { timestamps: true });

const ManuscriptSubmissions = mongoose.model('ManuscriptSubmissions', manuscriptSubmissionSchema);

module.exports = ManuscriptSubmissions;
