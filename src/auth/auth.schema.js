const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String
        },
        password: {
            type: String
        },
        confirmpassword:
        {
            type:String
        },
        title: {
            type: String
        },
        firstname: {
            type: String
        },
        middlename: {
            type: String
        },
        lastname: {
            type: String
        },
        degree: {
            type: String
        },
        preferredname: {
            type: String
        },
        phone: {
            type: String
        },
        email: {
            type: String,
            
        },
        orcid: {
            type: String
        },
        position: {
            type: String,
           
        },
        institution: {
            type: String
        },
        department: {
            type: String
        },
        address: {
            type: String
        },
        city: {
            type: String
        },
        postalcode: {
            type: String
        },
        country: {
            type: String,
            
        }

    }
);
const User = mongoose.model('user',userSchema);
module.exports = User;
