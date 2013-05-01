var scookie = require('../scookie');
var crypto = require('crypto');

scookie.init({
  name: 'testcookie',
  secret: 'secret',
  unauthorisedUrl: '/unauthorised',
  age: 5000
});

describe('scookie', function() {
  describe('getObjectHash', function() {
    it('includes all values and the cookie secret', function() {
      var hash = scookie.getObjectHash({ name: 'martin', number: 42, test: true });
      var expected = crypto.createHash('sha256').update('martin42truesecret').digest('hex');

      expect(hash).toBe(expected);
    });

    it('produces different hashes for different data', function() {
      var hash1 = scookie.getObjectHash({ name: 'martin', number: 42, test: true });
      var hash2 = scookie.getObjectHash({ name: 'martin', number: 41, test: true });

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getLoginCookie', function() {
    it('returns JSON object from cookie data', function() {
      var request = { cookies: { 'testcookie': '{ "real": "object" }' } };
      var cookie = scookie.getLoginCookie(request);

      expect(cookie.real).toBe('object');
    });
  });

  describe('verifyCookieHash', function() {
    it('checks the cookie hash against the cookie data', function() {
      var cookie = { name: 'martin', number: 42 };
      cookie.hash = scookie.getObjectHash(cookie);

      expect(scookie.verifyCookieHash(cookie)).toBe(true);
    });
  });

  describe('public interface', function() {
    it('exposes the correct public functions', function() {
      expect(scookie.init).toBeDefined();
      expect(scookie.login).toBeDefined();
      expect(scookie.logout).toBeDefined();
      expect(scookie.getCookie).toBeDefined();
      expect(scookie.isLoggedIn).toBeDefined();
      expect(scookie.middleware.mustBeLoggedIn).toBeDefined();
    });
  });

  describe('login', function() {
    it('adds a hash to the data object and issues correct cookie', function() {
      var cookie = { name: 'martin', number: 42 };

      var response = {
        cookie: function(name, data, options) {
          this.name = name;
          this.data = data;
          this.options = options;
        }
      };

      scookie.login(cookie, response);

      expect(cookie.hash).toBeDefined();
      expect(response.name).toBe('testcookie');
      expect(response.data).toMatch(/name/g);
      expect(response.data).toMatch(/number/g);
      expect(response.data).toMatch(/hash/g);
      expect(response.options.maxAge).toBe(5000);
      expect(response.options.httpOnly).toBeTruthy();
    });
  });

  describe('logout', function() {
    it('calls clearCookie with the correct cookie name', function() {
      var response = { clearCookie: jasmine.createSpy() };
      scookie.logout(response);

      expect(response.clearCookie).toHaveBeenCalledWith('testcookie');
    });
  });

  describe('getCookie', function() {
    it('returns cookie when valid', function() {
      var cookie = { name: 'martin', number: 42 };
      cookie.hash = scookie.getObjectHash(cookie);

      var request = { cookies: { 'testcookie': JSON.stringify(cookie) } };
      var cookieObject = scookie.getCookie(request);

      expect(cookieObject.name).toBe('martin');
      expect(cookieObject.number).toBe(42);
    });

    it('returns undefined when invalid', function() {
      var cookie = { name: 'martin', number: 42 };

      var request = { cookies: { 'testcookie': JSON.stringify(cookie) } };
      var cookieObject = scookie.getCookie(request);

      expect(cookieObject).toBe(undefined);
    });
  });

  describe('isLoggedIn', function() {
    it('returns true with valid cookie', function() {
      var cookie = { name: 'martin', number: 42 };
      cookie.hash = scookie.getObjectHash(cookie);

      var request = { cookies: { 'testcookie': JSON.stringify(cookie) } };

      expect(scookie.isLoggedIn(request)).toBeTruthy();
    });

    it('returns false with invalid cookie', function() {
      var cookie = { name: 'martin', number: 42 };
      cookie.hash = scookie.getObjectHash(cookie);
      cookie.name = 'martin.';

      var request = { cookies: { 'testcookie': JSON.stringify(cookie) } };

      expect(scookie.isLoggedIn(request)).toBeFalsy();
    });
  });

  describe('middleware.mustBeLoggedIn', function() {
    it('calls next if logged in', function() {
      var cookie = { name: 'martin', number: 42 };
      cookie.hash = scookie.getObjectHash(cookie);

      var request = { cookies: { 'testcookie': JSON.stringify(cookie) } };
      var next = jasmine.createSpy();

      scookie.middleware.mustBeLoggedIn(request, {}, next);

      expect(next).toHaveBeenCalled();
    });

    it('redirects if not logged in', function() {
      var request = { cookies: { 'testcookie': '' } };
      var response = { redirect: jasmine.createSpy() };

      scookie.middleware.mustBeLoggedIn(request, response);

      expect(response.redirect).toHaveBeenCalledWith('/unauthorised');
    });
  });
});
