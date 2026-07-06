const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Dedicated collection for article streams (taxonomy), separate from mailing lists.
const streamSchema = new Schema({
  name: {
    type: String,
    required: true
  }
}, { timestamps: true, collection: 'Streams' });

const Stream = mongoose.model('Stream', streamSchema);

module.exports = Stream;
