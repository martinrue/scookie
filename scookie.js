var crypto = require('crypto');
var _ = require('underscore');

var cookieName;
var cookieSecret;
var cookieAge = 1000 * 60 * 60 * 3;
var unauthorisedUrl = '/';

var hmac = function(data, key) {
  var hmac = crypto.createHmac('sha256', new Buffer(key, 'utf8'));
  return hmac.update(new Buffer(data, 'utf8')).digest('hex');
};

var parseJSON = function(data) {
  try {
    return data ? JSON.parse(data) : data;
  } catch(e) {
    return undefined;
  }
};

var getLoginCookie = function(request) {
  var cookie = request.cookies[cookieName];
  return parseJSON(cookie);
};

var getObjectHash = function(object) {
  var objectData = _.reduce(object, function(memo, value, key) {
    return key !== 'hash' ? memo + value : memo;
  }, '');

  return hmac(objectData, cookieSecret);
};

var verifyCookieHash = function(cookie) {
  return cookie.hash === getObjectHash(cookie);
};

var init = function(config) {
  cookieName = config.name;
  cookieSecret = config.secret;
  cookieAge = config.age || cookieAge;
  unauthorisedUrl = config.unauthorisedUrl || '/';
};

var login = function(data, response) {
  data.hash = getObjectHash(data);
  response.cookie(cookieName, JSON.stringify(data), { maxAge: cookieAge, httpOnly: true });
};

var logout = function(response) {
  response.clearCookie(cookieName);
};

var getCookie = function(request) {
  if (isLoggedIn(request)) return getLoginCookie(request);
};

var isLoggedIn = function(request) {
  var cookie = getLoginCookie(request);
  return cookie && verifyCookieHash(cookie);
};

var mustBeLoggedIn = function(req, res, next) {
  if (isLoggedIn(req)) return next();
  res.redirect(unauthorisedUrl);
};

module.exports = {
  init: init,
  login: login,
  logout: logout,
  getCookie: getCookie,
  isLoggedIn: isLoggedIn,
  middleware: { mustBeLoggedIn: mustBeLoggedIn }
};

if (process.env.test) {
  _.extend(module.exports, {
    getLoginCookie: getLoginCookie,
    getObjectHash: getObjectHash,
    verifyCookieHash: verifyCookieHash,
    hmac: hmac
  });
}
