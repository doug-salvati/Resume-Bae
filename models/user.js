// Model for a  user
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

// Schema for a userm which has a username, password, and a resume
var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  resume: {
      type: String,
  }
});

// User authentication
// thanks again to https://medium.com/of-all-things-tech-progress/starting-with-authentication-a-tutorial-with-node-js-and-mongodb-25d524ca0359
UserSchema.statics.authenticate = function (username, password, callback) {
  // Find the user
  User.findOne({ username: username }).exec(function (err, user) {
    if (err) {
      return callback(err)
    } else if (!user) {
      var err = new Error('User not found.');
      err.status = 401;
      return callback(err);
    }
    // Compare passwords
    bcrypt.compare(password, user.password, function (err, result) {
      if (result) {
        return callback(null, user);
      } else {
        return callback();
      }
    })
  });
}

// Passwords need to be hashed for security
UserSchema.pre('save', function (next) {
  var user = this;
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
});

var User = mongoose.model('User', UserSchema);
module.exports = User;