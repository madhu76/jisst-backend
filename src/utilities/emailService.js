const { google } = require('googleapis');

// These id's and secrets should come from .env file.
const CLIENT_ID = process.env.Google_API_ClientId;
const CLEINT_SECRET = process.env.Google_API_ClientSecret;
const REDIRECT_URI = 'https://jisst-backend.vercel.app';
const REFRESH_TOKEN = process.env.Google_API_RefreshToken;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(To, cc, Subject, Message) {
  try {
    // Convert to RFC 2822 formatted email
    const email = `From: fsrti.com@gmail.com\nTo: ${To}\nCc: ${cc}\nSubject: ${Subject}\nContent-Type: text/html; charset="UTF-8"\nContent-Transfer-Encoding: 7bi\nMIME-Version: 1.0\n\n${Message}`;

    // The body needs to be base64url encoded.
    const base64EncodedEmail = Buffer.from(email).toString('base64');


    const result = await google.gmail('v1').users.messages.send({
      userId: 'fsrti.com@gmail.com',
      requestBody: {
        raw: base64EncodedEmail
      },
      auth: oAuth2Client
    });
    return result;
  } catch (error) { 
    throw new Error(error);
  }
}

exports.sendMail = sendMail;
