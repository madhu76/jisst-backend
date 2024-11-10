// sendMail.js

async function sendMail(
  To,
  cc,
  Subject,
  Message,
  bcc = 'mavsankar@gmail.com,vadrevu.sree@researchfoundation.in'
) {
  // Read environment variables
  const CLIENT_ID = process.env.ZOHOMAIL_CLIENT_ID;
  const CLIENT_SECRET = process.env.ZOHOMAIL_CLIENT_SECRET;
  const ACCOUNT_ID = process.env.ZOHOMAIL_ACCOUNT_ID;

  if (!CLIENT_ID || !CLIENT_SECRET || !ACCOUNT_ID) {
    throw new Error('Missing required environment variables.');
  }

  // Step 1: Get access token
  const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
  const tokenParams = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: 'ZohoMail.messages.CREATE',
  });

  let accessToken;
  try {
    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams.toString()}`, {
      method: 'POST',
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(
        `Token request failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorData}`
      );
    }

    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Access token not found in the response.');
    }
  } catch (error) {
    console.error('Error fetching access token:', error);
    throw error;
  }

  // Step 2: Send email
  const emailUrl = `https://mail.zoho.com/api/accounts/${ACCOUNT_ID}/messages`;
  const emailBody = {
    fromAddress: 'jisst@researchfoundation.in',
    toAddress: To,
    ccAddress: cc,
    bccAddress: bcc,
    subject: Subject,
    content: Message,
  };

  try {
    const emailResponse = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(
        `Email send failed: ${emailResponse.status} ${emailResponse.statusText} - ${errorData}`
      );
    }

    const emailData = await emailResponse.json();
    return emailData;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

exports.sendMail = sendMail;