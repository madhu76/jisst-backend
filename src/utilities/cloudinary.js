  
const cloudinary = require("cloudinary").v2;


cloudinary.config({
  cloud_name: 'jisst',
  api_key: process.env.Cloudinary_API_Key,
  api_secret: process.env.Cloudinary_API_Secret
});

module.exports = cloudinary;