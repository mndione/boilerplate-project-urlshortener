require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const shortUrlSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  shortUrlId: Number
}, { strictQuery: false });

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

// Parse JSON and url-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// add shorturl function
const addShortUrl = async (url) => {
  let shorturl = new ShortUrl({url: url});
  //console.log(shorturl);
  shorturl.save(async (err, data) => {
    if(err) return console.log(err);
    //console.log(data);
    return await getShortUrl(url);
  });
};

// get shorturl function
const getShortUrl = async (x) => {
  let cond;
  if(isNaN(x)) cond = {url: x};
  else cond = {shortUrlId: x*1};
  //console.log(cond);
  return await ShortUrl.findOne(cond);
};


// add shorturl router
app.post('/api/shorturl', async function(req, res) {
  //console.log(req.body);
  const validator = require('validator');
  const url = req.body.url;
  if(!validator.isURL(url)) res.json({error: 'invalid url'});
  //console.log(url);
  const shorturl = await getShortUrl(url);
  if(!shorturl) shorturl = await addShortUrl(url);
  //console.log(shorturl, url);
  res.json({ original_url: url, short_url: shorturl.shortUrlId });
});

// get getshorturl router
app.get('/api/shorturl/:urlID', async function(req, res) {
  const shortUrlId = req.params.urlID;
  const shorturl = await getShortUrl(shortUrlId);
  if(shorturl) res.redirect(shorturl.url);
  else res.json({error: 'shorturl not found'});
  
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
