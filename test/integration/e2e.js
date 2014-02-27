'use strict';
require('should');
var http = require('http');

var driverModule = require('../../driver');

function fetchPage(port, path, done) {
  var page = [];
  var req = http.request({port: port, method: 'get', path: path}, function(res) { 
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

function fetchJson(port, path, done) {
  fetchPage(port, path, function(err, payload) {
    if (err) return done(err);
    done(null, JSON.parse(payload));
  });
}

describe('Apple', function() {
    var driver;
    before(function(done) {
      driver = driverModule.createDriver({});
      driver.start(done);
    });
    beforeEach(function() {
        this.apple = { sound: 'crunch' };
    });

    afterEach(function() {
        delete this.apple;
    });

    after(function(done) {
      driver.stop(done);
    });

    it('should go crunch', function() {
        this.apple.should.have.property('sound', 'crunch');
    });

    it('should show previously recorded log entries', function(done) {
        fetchJson(3000, '/logger/show', function(err, json) {
          if (err) return done(err);
          json.length.should.be.above(0);
          json[0].should.property('created');
          json[0].should.property('_id');
          json[0].should.property('__v');
          done();
        });
    });

    it('serves the main page', function(done) {
        fetchPage(3000, '/', function(err, html) {
          if (err) return done(err);
          html.should.match(/<title>MEAN - A Modern Stack - Development - MEAN - A Modern Stack - Development<.title>/);
          done();
        });
    });
});
