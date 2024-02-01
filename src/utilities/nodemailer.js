const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    //service: 'gmail',
    auth: {
        type:"OAuth2",
        user: 'fsrti.com@gmail.com',
        clientId: '443078795438-3bhv8m9edugd77kfi7c8cj7dbvtmk88v.apps.googleusercontent.com',
        clientSecret: 'WUUM4A6gtdwxIiOCjsXa2yWo',
        refreshToken: '1//04t-HOM9VH-vDCgYIARAAGAQSNwF-L9IrV3OW2DPRpTFswZ23kBhlSzm0TLQgsLHEU03fou6wov1zhvNwKMkiuFDSGmKRcNm67AU',
        accessToken:'ya29.a0AfH6SMAvi5eePZWYMz0wzq6yY915AL9d1lrlcV0_w8NhqjLBGg6F3TFHezkmNwn-MX7TqTRoITjXnS19cSpM6kSKqq3LcQELztvqR6cegeSMFGPr_b6XoGng1EI5s_DvxFu1wUkxP71LEkXPXqC6atFnDut19SYGfe8'
     
    }
})

module.exports = transporter;