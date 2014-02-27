'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
    fs = require('fs'),
    passport = require('passport'),
    logger = require('mean-logger');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

exports.createDriver = function(options) {

  var server;
  var connection;
  function start(done) {
      // Load configurations
      // Set the node enviornment variable if not set before
      process.env.NODE_ENV = options.NODE_ENV || process.env.NODE_ENV || 'development';

      // Initializing system variables 
      var config = require('./config/config'),
          mongoose = require('mongoose');

      // Bootstrap db connection
      connection = mongoose.createConnection(options.db || config.db, function(err) {
          // Bootstrap models
          var models_path = __dirname + '/app/models';
          var walk = function(path) {
              fs.readdirSync(path).forEach(function(file) {
                  var newPath = path + '/' + file;
                  var stat = fs.statSync(newPath);
                  if (stat.isFile()) {
                      if (/(.*)\.(js$|coffee$)/.test(file)) {
                          require(newPath);
                      }
                  } else if (stat.isDirectory()) {
                      walk(newPath);
                  }
              });
          };
          walk(models_path);

          // Bootstrap passport config
          require('./config/passport')(passport);

          var app = express();

          // Express settings
          require('./config/express')(app, passport, connection);

          // Bootstrap routes
          var routes_path = __dirname + '/app/routes';
          var walk = function(path) {
              fs.readdirSync(path).forEach(function(file) {
                  var newPath = path + '/' + file;
                  var stat = fs.statSync(newPath);
                  if (stat.isFile()) {
                      if (/(.*)\.(js$|coffee$)/.test(file)) {
                          require(newPath)(app, passport);
                      }
                  // We skip the app/routes/middlewares directory as it is meant to be
                  // used and shared by routes as further middlewares and is not a 
                  // route by itself
                  } else if (stat.isDirectory() && file !== 'middlewares') {
                      walk(newPath);
                  }
              });
          };
          walk(routes_path);


          // Start the app by listening on <port>
          var port = options.PORT || process.env.PORT || config.port;
          server = app.listen(port, function(err) {
            if (err) return done(err);
            // Initializing logger
            logger.init(app, passport, connection);
            console.log('Express app started at http://localhost:' + port);
            done();
          });
      });
  }

  function stop(done) {
    function close(err) {
      connection.close(function(err2) {
        done(err || err2);
      });
    }

    server && server.close(close) || close();
  }

  return { 
    start: start,
    stop: stop
  }
}

// Expose app
//exports = module.exports = app;
