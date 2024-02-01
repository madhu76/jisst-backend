const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = require('./user');
const _ = require('lodash');
require('dotenv').config();
const transporter = require('../utilities/nodemailer');

// const mailgun = require("mailgun-js");
// const DOMAIN = 'sandboxb3b9a41822114aa8b0c680f2cf6e2690.mailgun.org';
// const mg = mailgun({ apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN });
// console.log(apiKey);
const createTokenSendResponse = (user, res, next) => {
  const payload = {
    _id: user._id,
    username: user.username,
    //role: user.role,
    //active: user.active,
  };
  jwt.sign(
    payload,
    '123', {
    expiresIn: '10 years',
  }, (err, token) => {
    if (err) {
      res.status(422);
      const error = Error('Unable to login');
      next(error);
    } else {
      const emailHTMLContent = `
          <h1>JISST</h1>
          <hr>
          <h3>You're receiving this message because of a successful sign-in</h3>
          <br>
          <p>
            Thanks,<br>
            Journal of Innovation Sciences and Sustainable Technologies
          </p>
        `
      transporter.sendMail({
        from: 'JISST<fsrti.com@gmail.com>',
        to: user.email,
        subject: `JISST - Successful sign-in for ${user.firstname} ${user.lastname}`,
        html: emailHTMLContent,
      }, (err, res) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Email Sent');
        }
      })
      console.log(token);
      res.json({ token });
    }
  },
  );
};

const get = (req, res) => {
  res.json({
    message: 'Hello Auth! 🔐',
  });
};

const signup = async (req, res, next) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 12);
    console.log(req.body.username);
    let userData = req.body;
    userData.password = hashed;
    let user = new users(userData);
    user.save((err, newuser) => {
      if (err) {
        console.log(err)
        res.json({ success: false, msg: 'failed to register user' });
      }
      else {
        console.log(newuser);
        const emailHTMLContent = `
        <h1>JISST</h1>
        <hr>
        <h3>We are happy to see you here!</h3>
        <br>
        <p>
          Thanks,<br>
          Journal of Innovation Sciences and Sustainable Technologies
        </p>
      `
        transporter.sendMail({
          from: 'JISST<fsrti.com@gmail.com>',
          to: newuser.email,
          subject: `Welcome to JISST`,
          html: emailHTMLContent,
        }, (err, res) => {
          if (err) {
            console.log(err);
          } else {
            console.log('Email Sent');
          }
        })

        res.json({ success: true });
      }
    });


  } catch (error) {
    res.status(500);
    next(error);
  }
};

const login = async (req, res, next) => {
  console.log(req.body.password);
  console.log(req.loggingInUser.password);
  try {
    const result = await bcrypt.compare(
      req.body.password,
      req.loggingInUser.password,
    );
    console.log(`result` + result);
    if (result) {
      createTokenSendResponse(req.loggingInUser, res, next);
    } else {
      res.status(422);
      throw new Error('Unable to login');
    }
  }
  catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    next(error);
  }
};

//forgot password
const forgotPassword = function (req, res) {
  const email = req.body.email;
  console.log(email);
  users.findOne({ email }, async function (err, user) {
    if (err || !user) {
      return res.status(400).json({ error: "User with this email does not exist" });
    }
    const token = jwt.sign({ _id: user._id }, process.env.RESET_PASSWORD_KEY, { expiresIn: '20m' });
    
    user.updateOne({resetLink: token }, function (err, success) {
      tkn=token;
    
      if (err) {
        return res.status(400).json({ error: "reset password link error" });
      }
      else {
      
        transporter.sendMail({
          from: 'JISST<fsrti.com@gmail.com>',
          to: email,
          subject: `Reset Password`,
          html: `
            <h2>Please click on this <a href="${process.env.CLIENT_URL}/resetpassword/${token}">link</a> to reset password</h2>
            `
        }, (err, res) => {
          if (err) { return res.json({ error: err.message })  }
          else
          return res.json({ message: 'Email has been sent,kindly follow the instruction ' })

        });
      }


    })
  })
}




const resetPassword =  function (req, res) {
  const {pswrd,token}=req.body;
  console.log(pswrd + " " + token)
  resetLink=token
  newPass = pswrd
  if(resetLink)
  {
      jwt.verify(resetLink,process.env.RESET_PASSWORD_KEY,function(error,decodedData){
        
        if (error) { return res.status(401).json({ error: "Invalid Token or Token is Expired" })  }
        console.log(resetLink);
        users.findOne({resetLink},async (err,user)=>{
          if (err || !user) {
            return res.status(400).json({ error: "User with this token does not exist" });
          }
        
          const hashed = await bcrypt.hash(newPass, 12);

          const obj={password:hashed,resetLink:''}
console.log(hashed)
          user = _.extend(user,obj);
          user.save((err,result)=>{
            if (err) {
              return res.status(400).json({ error: "reset password error" });
            }
            else {
            
                return res.status(200).json({ message: 'Your Password has been Changed ' })
                   
            }

            
          }
          )
        })
      })
  }
  else
  return res.status(401).json({ error: "Authetication Error!!!" });

}

module.exports = {
  get,
  login,
  signup,
  forgotPassword,
  resetPassword,

};



  // mg.messages().send(data, function (error, body) {

 // const data = {
    //   from: 'JISST<fsrti.com@gmail.com>',
    //   to: email,
    //   subject: `Reset Password`,
    //   html: `
    //     <h2>Please click on given link to reset password</h2>
    //     <p>${process.env.CLIENT_URL}/resetpassword/${token}</p>`
    // };