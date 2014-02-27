'use strict';
require('should');
var http = require('http');
var MongoClient = require('mongodb').MongoClient;

var driverModule = require('../../driver');

var PORT = 3005;
var DB_URL = 'mongodb://localhost/mean-integration';

function fetchPage(path, done) {
  var page = [];
  var req = http.request({port: PORT, method: 'get', path: path}, function(res) { 
    if (res.statusCode != 200) return done(new Error('Status code ' + res.statusCode));
    res.setEncoding('utf8');
    res.on('data', function(ch) { page.push(ch); });
    res.on('error', function(e) { done(e); });
    res.on('end', function() {
      done(null, page.join(''));
    });
  });
  req.on('error', function(e) {
    done(e);
  });
  req.end();
}

function fetchJson(path, done) {
  fetchPage(path, function(err, payload) {
    if (err) return done(err);
    done(null, JSON.parse(payload));
  });
}

describe('MEAN', function() {
    var driver;
    before(function(done) {
      MongoClient.connect(DB_URL, function(err, db) {
        if(err) return done(err);
        db.dropDatabase(function(err) {
          if (err) return done(err);
          driver = driverModule.createDriver({PORT: PORT, NODE_ENV: 'test', db: DB_URL});
          driver.start(done);
        });
      });
    });

    after(function(done) {
      driver.stop(done);
    });

    it('should show previously recorded log entries', function(done) {
        fetchJson('/logger/log', function(err) {
            if (err) return done(err);
            fetchJson('/logger/show', function(err, json) {
              if (err) return done(err);
              json.length.should.be.eql(1);
              json[0].should.property('created');
              json[0].should.property('_id');
              json[0].should.property('__v');
              done();
            });
        });
    });

    it('serves the main page', function(done) {
        fetchPage('/', function(err, html) {
          if (err) return done(err);
          html.should.match(/<title>MEAN - A Modern Stack - Test - MEAN - A Modern Stack - Test<.title>/);
          done();
        });
    });
});
