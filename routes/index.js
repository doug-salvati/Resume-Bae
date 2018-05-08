var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Résumé Bae' });
});

/* POST login page */
router.post('/user', function(req, res, next) {
  res.render('user', { title: 'Login to Résumé Bae', resume: req.body.resume });
});

/* POST create a user */
router.post('/user/create', function(req, res, next) {
  console.log(req.body.username + " requests an account.");
  if (req.body.username && req.body.password) {
    console.log("Request is good");
    var userData = {
      username: req.body.username,
      password: req.body.password,
      conf: req.body.passwordConf,
      resume: req.body.resume === "blank" ? '{"max_height":864,"max_width":624,"default_block_height":216,"default_line_height":6,"minimum_block_width":96,"available_height":648,"rows":[[{"height":216,"width":624,"contents":"' + req.body.username + '\'s resume","isLine":false,"class":"none","alignment":"left"}]],"line_style":"solid"}' : req.body.resume,
    }
    // insert data to mongo
    console.log("Adding user to DB...");
    if (userData.password !== userData.conf) {
      return res.render("user", {errmsg: 'Passwords do not match my dude.'});
    }
    User.create(userData, function (err, user) {
      console.log("DB call finished. Results to follow:");
      if (err) {
        console.log("ERROR: " + err);
        return res.render("user", {errmsg: 'User already exists, try another name.'});
      } else {
        console.log("Succeeded, redirecting...");
        req.session.userId = user._id;
        req.session.username = req.body.username;
        req.session.resume = userData.resume;
        return res.redirect('/editor');
      }
    });
  } else {
    console.log("Request is bad!");
    return res.render("user", {errmsg: 'All fields must be filled in.'});
  }
});

/* POST login a user */
router.post('/user/login', function(req, res, next) {
  console.log(req.body.existing_username + " wants to log in.");
  if (req.body.existing_username && req.body.existing_password) {
    console.log("Request is good");
    // Authenticate the user
    User.authenticate(req.body.existing_username, req.body.existing_password, function (error, user) {
      if (error || !user) {
        console.log("Failed to authenticate " + req.body.existing_username);
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return res.render("user", {errmsg: 'Wrong username or password.'});
      } else {
        console.log("Successfully authenticated " + req.body.existing_username);
        req.session.userId = user._id;
        req.session.username = req.body.existing_username;
        req.session.resume = user.resume;
        return res.redirect('/editor');
      }
    });
  } else {
    console.log("Request is bad!");
    return res.render("user", {errmsg: 'All fields must be filled in.'});
  }
});

/* GET logout a user */
router.get('/user/logout', function(req, res, next) {
  if (req.session) {
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        console.log("Logged out user.");
        return res.redirect('/');
      }
    });
  } else {
    console.log("No session, can't perform a logout.")
  }
});

/* GET editor page */
router.get('/editor', function(req, res, next) {
  res.render('editor', { title: 'Edit your Résumé' });
});

/* POST save a resume */
router.post('/editor/save', function(req, res, next){
  if (req.session) {
    User.update({_id: req.session.userId}, {$set: {resume: req.body.resume}}, function(error, user) {
      if (error || !user) {
        console.log("Failed to save.");
        var err = new Error('Failed to save.');
        err.status = 401;
        return next(err);
      } else {
        req.session.resume = req.body.resume;
        return res.redirect('/editor');
      }
    });
  } else {
    console.log("Nothing to save!")
  }
});

module.exports = router;
