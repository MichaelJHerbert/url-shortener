const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const config = require('config');
const dns = require('dns');
const cors = require('cors');

const app = express();

const Url = require('./models/Url');

// Basic Configuration
const port = process.env.PORT || 3000;

// Get Mongo URI
const db = config.get('mongoURI');

// Connect to database
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// @route POST api/shorturl/new
// @desc Post URL, shorten and return json including shortened URL
// @access Public
app.post('/api/shorturl/new', function(req, res) {
  let urlData = req.body.url;
  // Get hostname only
  const regexDnsLookup = /^((http|https):\/\/www\.)|www\./i;
  dns.lookup(
    req.body.url.replace(regexDnsLookup, ''),
    (err, address, family) => {
      if (err) {
        res.json({ error: 'invalid URL' });
      } else {
        // Add http:// if not already included
        const regexHttpCheck = /^(http|https):\/\//i;
        if (!regexHttpCheck.test(urlData)) {
          urlData = 'http://' + urlData;
        }

        // Check URL is not already in collection
        Url.findOne({ original_url: urlData }, (err, data) => {
          if (err) {
            res.json({ error: err });
          } else if (data === null) {
            // Add URL to database
            const newUrlToAdd = new Url({
              original_url: urlData,
              short_url: Math.floor(Math.random() * 10000)
            });
            newUrlToAdd
              .save()
              .then(item => res.json(item))
              .catch(err => {
                res.json({ error: err });
              });
          } else {
            res.json({
              Error: `${data.original_url} already shortened to ${
                data.short_url
              }`
            });
          }
        });
      }
    }
  );
});

// @route GET api/shorturl/short_url
// @desc Redirect to original_url
// @access Public
app.get('/api/shorturl/:short_url', function(req, res) {
  const short_url = req.params.short_url;
  Url.findOne({ short_url }, (err, data) => {
    if (err) {
      res.json({ error: err });
    } else if (data === null) {
      res.json({ error: `${short_url} is not stored as a shortened URL` });
    } else {
      res.redirect(data.original_url);
    }
  });
});

app.listen(port, function() {
  console.log('Node.js listening ...');
});
