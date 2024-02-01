const Newsubmission = require('./newsubmission');
const NewFilesubmission = require('./newfilesubmission');
const Articlesubmission = require('./articlesubmission');
const ArticleFileSubmission = require('./articlefilesubmission');
const cloudinary = require("../utilities/cloudinary");

const get = (req, res) => {
  res.json({
    message: 'Hello Author! 🔐',
  });
};

const newsubmissionData = async (req, res, next) => {

  try {
    req.body.ref_id = req.userId;
    this.id=req.userId;
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

const displayArticle = async (req,res,next) => {
  try{ 
    const article = await Articlesubmission.findOne({item_id:req.params.id});
    let view = article.views;
    Articlesubmission.updateOne({item_id:req.params.id},{$set:{views:view+1}}, 
      function(err, results) {
        console.log(results.result);
    });
    const updatedArticle = await Articlesubmission.findOne({item_id:req.params.id});
    console.log('find new article data '+updatedArticle);
      res.json(JSON.stringify(updatedArticle));
} catch (error) {
  res.status(500);
  next(error);
}
};

const downloadArticle = async (req,res,next) => {
  try{ 
    const article = await Articlesubmission.findOne({item_id:req.params.id});
    let download = article.downloads;
    Articlesubmission.updateOne({item_id:req.params.id},{$set:{downloads:download+1}}, 
      function(err, results) {
        console.log(results.result);
    });
    const updatedArticle = await Articlesubmission.findOne({item_id:req.params.id});
    console.log('download Article '+updatedArticle);
      res.json(JSON.stringify(updatedArticle));
} catch (error) {
  res.status(500);
  next(error);
}
};



const newfilesubmissionData = async (req, res, next) => {

  try {
    req.body.ref_id = this.id ;
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
      ref_id:this.id,
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
const getArticlesData = async (req,res,next) => {
  try{
    const articles = await Articlesubmission.find({});
    let data = [];
    articles.forEach(function(ff){
      if(ff.isTrue && ff.isTrue==true ) {
        data.push(ff);
      }
    });
    console.log(data);
    res.json(data);
  }catch(err){
    next(err);
  }
};

const getDownloadData = async (req,res,next) => {
  try{
    const articles = await Articlesubmission.find({}).sort({"downloads":-1,"item_id":1});
    let data = [];
    articles.forEach(function(ff){
      if(ff.isTrue && ff.isTrue==true ) {
        data.push(ff);
      }
    });
    console.log("this is" + data);
    res.json(data);
  }catch(err){
    next(err);
  }
};

const getViewsData = async (req,res,next) => {
  try{
    const articles = await Articlesubmission.find({}).sort({"views":-1,"item_id":1});
    let data = [];
    articles.forEach(function(ff){
      if(ff.isTrue && ff.isTrue==true ) {
        data.push(ff);
      }
    });
    console.log("this is" + data);
    res.json(data);
  }catch(err){
    next(err);
  }
};

const  articleSubmissionData = async (req, res, next) => {
  try {
    let articleSubmission = new Articlesubmission(req.body);
    console.log(`data` , articleSubmission);
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
    console.log("req.body.formId = " ,req.body.formId );
    if (req.file)
      result = await cloudinary.uploader.upload(req.file.path,{
        folder:'Articles'
      });
    else
      console.log(`upload plzzz`);
    console.log(`result` , result);
    delete req.body.image;
    let articlefilesubmission = new ArticleFileSubmission({
      avatar: result.secure_url,
      cloudinary_id: result.public_id,
      ref_id:this.id,
      formId:req.body.formId,
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
          fileId : result._id,
          fileUrl : result.avatar,
        }
        Articlesubmission.findOneAndUpdate(
          {_id:result.formId} , 
          {$set:update},
          {new:true},(err, doc) =>{
            if(err){
              console.log("error error error error" , err);
            }
            else {
              console.log(doc.fileId , " " ,doc.fileUrl);
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

module.exports = {
  get,
  newsubmissionData,
  newfilesubmissionData,
  articleSubmissionData,
  articleFileSubmission,
  getArticlesData,
  getDownloadData,
  getViewsData,
  displayArticle,
  downloadArticle
};