const { version } = process.env;

const express = require('express');
const bodyParser = require('body-parser');

const storage = require('@routes/storage');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(express.static('public'));
app.use(express.json({
  type: ['application/json', 'text/plain']
}));

app.get('/version', (_req, res) => {
  res.json({ version });
});

app.use('/storage', storage);

app.get('/', (_req, res) => res.render('index', {}));
app.get('/model', (_req, res) => res.render('model', {}));

module.exports = app;
