const mongoose = require('mongoose');
const articlesubmissionSchema = new mongoose.Schema(
    {
        title: {
            type: String
        },
        keywords: {
            type: String
        },
        abstract: {
            type: String
        },
        research:{
            type: String
        },
        jname:{
            type: String
        },
        author:
        {
            type: String
        },
        aboutAuthor: {
            type: String
        },
        receivedDate: {
            type: String
        },
        fileId:{
            type:String
        },
        fileUrl: {
            type:String
        },
        isTrue: {
            type:Boolean,
            default:false,
        },
        citethisArticle: {
            type: String
        },
        views:{
            type:Number,
            default:0
        },
        downloads:{
            type:Number,
            default:0
        },
        item_id:{type:String}
    },{timestamps: true});
const Articlesubmission = mongoose.model('articlesubmission', articlesubmissionSchema);
module.exports = Articlesubmission;