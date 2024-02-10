const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the EmailList schema
const emailListSchema = new Schema({
  Name: {
    type: String,
    required: true
  },
  EmailIds: [{
    type: String,
    required: true
  }]
});

// Define the main document schema
const allowedEmailAddressesSchema = new Schema({
    ManuscriptMailingList: [emailListSchema]
}, { timestamps: true, collection:'AllowedEmailAddresses' }); // Adding timestamps for creation and update times

// Compile the model
const AllowedEmailAddresses = mongoose.model('AllowedEmailAddresses', allowedEmailAddressesSchema);

module.exports = AllowedEmailAddresses;
