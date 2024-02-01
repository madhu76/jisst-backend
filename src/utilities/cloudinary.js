  
const cloudinary = require("cloudinary").v2;


cloudinary.config({
  cloud_name: 'jisst',
  api_key: '434253341977259',
  api_secret: 'lxq42oPr31z1QxVAaOT2CX3EevM',
});

module.exports = cloudinary;