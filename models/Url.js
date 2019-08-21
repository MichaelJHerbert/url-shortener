const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UrlSchema = new Schema({
  original_url: String,
  short_url: Number
});

module.exports = Url = mongoose.model('url', UrlSchema);
