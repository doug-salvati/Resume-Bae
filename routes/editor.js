var express = require('express');
var router = express.Router();

/* GET editor page */
router.get('/', function(req, res, next) {
  res.render('editor', { title: 'Edit your Résumé' });
});

module.exports = router;
