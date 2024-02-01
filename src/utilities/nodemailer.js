const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    //service: 'gmail',
    auth: {
        type:"OAuth2",
        user: 'fsrti.com@gmail.com',
        clientId: '<clientID>',
        clientSecret: '<clientSecret>',
        refreshToken: '<refreshToken>',
        accessToken:'<accessToken>'
     
    }
})

module.exports = transporter;