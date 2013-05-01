# scookie

scookie helps you securely persist JSON data to HTTP cookies for user login

## Installation

```
npm install https://github.com/martinrue/scookie/tarball/master
```

## Initialisation

Call `init` to set the name of the cookie, the cookie secret, the unauthorised redirect URL and the cookie age (ms):

```javascript
scookie.init({
  name: 'myapp',
  secret: 'z98Earn0TSBh50C',
  unauthorisedUrl: '/',
  age: 24 * 60 * 60 * 1000
});
```

## Login

Call `login` to issue a cookie containing data about the user:

```javascript
var user = { id: 1, username: 'martin', name: 'Martin Rue' };
scookie.login(user, response);
```

`response` should be a `connect`-based HTTP response object capable of setting a response cookie. For example, the `response` object provided by both `connect` and `express` handlers will work fine.

## Logout

Call `logout` to clear any issues cookies:

```javascript
scookie.logout(response);
```

## Get User Data

To retrieve data about the current session from the cookie, call `getCookie`:

```javascript
var cookie = scookie.getCookie(request);
```

## Check User Login

To determine if a login cookie has been issued, call `isLoggedIn`:

```javascript
if (scookie.isLoggedIn(request)) {
  // client has untampered cookie set
}
```

## Connect Middleware

To avoid constantly checking `isLoggedIn`, you can use the middleware function instead:

```javascript
app.get('/account', scookie.middleware.mustBeLoggedIn, funtion(req, res) {
  // only called if client has untampered cookie set
});
```

## Express Example App

```javascript
var http = require('http');
var express = require('express');
var scookie = require('scookie');

var app = express();
var server = http.createServer(app);

app.configure(function() {
  app.use(express.cookieParser());
});

scookie.init({ 
  name: 'woooo', 
  secret: 'secret', 
  age: 3600000, 
  unauthorisedUrl: '/unauthorised' 
});

app.get('/', function(req, res) {
  res.send('Hello');
});

app.get('/login', function(req, res) {
  scookie.login({ username: 'martin' }, res);
  res.redirect('/account');
});

app.get('/account', scookie.middleware.mustBeLoggedIn, function(req, res) {
  var cookie = scookie.getCookie(req);
  res.send('account for: ' + cookie.username);
});

server.listen(1234);
```
