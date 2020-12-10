var http = require('http');
var express = require('express');
var Session = require('express-session');
var google = require('googleapis');
var docs = google.docs_v1;
var OAuth2 = google.Auth.OAuth2;
const ClientId = "766722836593-7d2lgdd47ubu6keo22v53tmemkutu29u.apps.googleusercontent.com";
const ClientSecret = "cJ3DOvw3hNzQNWdcitjdrSVt";
const RedirectionUrl = "http://gapi.zulfahmed.com/googleRedirect";

export default var app = express();
app.use(Session({
    secret: 'raysources-secret-19890913007',
    resave: true,
    saveUninitialized: true
}));

function getOAuthClient () {
    return new OAuth2(ClientId ,  ClientSecret, RedirectionUrl);
}

function getAuthUrl () {
    var oauth2Client = getOAuthClient();
    // generate a url that asks permissions for Google+ and Google Calendar scopes
    var scopes = [
      'https://www.googleapis.com/auth/documents'
    ];

    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes // If you only need one scope you can pass it as string
    });

    return url;
}

app.use("/googleRedirect", function (req, res) {
    var oauth2Client = getOAuthClient();
    var session = req.session;
    var code = req.query.code;
    oauth2Client.getToken(code, function(err, tokens) {
      // Now tokens contains an access_token and an optional refresh_token. Save them.
      if(!err) {
        oauth2Client.setCredentials(tokens);
        session["tokens"]=tokens;
        res.send(`
            <h3>Login successful!!</h3>
            <a href="/details">Go to details page</a>
        `);
      }
      else{
        res.send(`
            <h3>Login failed!!</h3>
        `);
      }
    });
});

app.use("/details", function (req, res) {
    var oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(req.session["tokens"]);

    var p = new Promise(function (resolve, reject) {
        docs.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
            resolve(response || err);
        });
    }).then(function (data) {
        res.send(`
            <img src=${data.image.url} />
            <h3>Hello ${data.displayName}</h3>
        `);
    })
});

app.use("/", function (req, res) {
    var url = getAuthUrl();
    res.send(`
        <h1>Authentication using google oAuth</h1>
        <a href=${url}>Login</a>
    `)
});


var port = 1234;
var server = http.createServer(app);
server.listen(port);
server.on('listening', function () {
    console.log(`listening to ${port}`);
});

