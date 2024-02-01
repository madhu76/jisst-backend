const users = require('./user')
const Newsubmission = require('../author/newsubmission');
const Newfilesubmission=require('../author/newfilesubmission');
const bodyParser = require('body-parser')
const mongoose = require('../db/connection') //DB connection
const express= require('express')
const app = express()
const jwt = require('jsonwebtoken');
app.use(bodyParser.urlencoded({ extended: false })) 
app.use(bodyParser.json())

let id;
function checkTokenSetUser(req, res, next) {
  const authHeader = req.get('Authorization');
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      // use jwt lib to decode
      jwt.verify(token, '123', (error, user) => {
        if (error) {
          console.log('🚫 Un-Authorized 🚫')
          console.log(error);
        }
        req.user = user;
        req.userId=user._id; // storing user id for refrence in other collections
       console.log(`user id`+user.username);
        next();
      });
    } else {
      next();
    
    }
  } else {
    next();
  }
}
const findUser = (defaultLoginError, isError, errorCode = 422) => async (req, res, next) => {
    try {
      const user = await users.findOne({ username: req.body.username});
      console.log('find user'+user);
      if (isError(user)) {
        res.status(errorCode);
        next(new Error(defaultLoginError));
      } else {
        req.loggingInUser = user;
        next();
      }
    } catch (error) {
      res.status(500);
      next(error);
    }
  };


  const findId = (defaultLoginError, isError, errorCode = 422) => async (req, res, next) => {
    try {
      const user = await users.findOne({ username: req.params.username});
      if (isError(user)) {
        res.status(errorCode);
        next(new Error(defaultLoginError));
      } else {
        id = user._id;
        console.log(`find id `+id);
        res.json({ id });
      }
    } catch (error) {
      res.status(500);
      next(error);
    }
  };

  const findNewsubmission = (defaultLoginError, isError, errorCode = 422) => async (req, res, next) => {
    try {
      const user = await Newsubmission.findOne({ ref_id: req.params.id});
      
      console.log('find new sub '+user);
      if (isError(user)) {
        res.status(errorCode);
        next(new Error(defaultLoginError));
      } else {
        title= user.title;
        console.log(`title `+user);
        res.json( JSON.stringify(user) );
      }
    } catch (error) {
      res.status(500);
      next(error);
    }
  };


  const findNewfilesubmission = (defaultLoginError, isError, errorCode = 422) => async (req, res, next) => {
    try {
      const userFile = await Newfilesubmission.findOne({ ref_id: req.params.id});
      console.log('find new sub '+userFile);
      if (isError(userFile)) {
        res.status(errorCode);
        next(new Error(defaultLoginError));
      } else {
        title= userFile.avatar;
        console.log(`title `+userFile);
        res.json( JSON.stringify(userFile) );
      }
    } catch (error) {
      res.status(500);
      next(error);
    }
  };

  function isLoggedIn(req, res, next) {
    if (req.user) {
      console.log('in login method');
      next();
    } else {
      unAuthorized(res, next);
    }
  }

  function unAuthorized(res, next) {
    const error = new Error('🚫 Un-Authorized 🚫');
    res.status(401);
    next(error);
  }
module.exports={
    findUser,
    isLoggedIn,
    checkTokenSetUser,
    findId,
    findNewsubmission,
    findNewfilesubmission,
   
}