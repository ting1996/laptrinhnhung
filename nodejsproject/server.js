var express  = require('express');
var app      = express();


var net = require('net');
var ns = net.createServer();

var server = require('http').Server(app);
var io = require('socket.io')(server);



var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var info =[];
var clients =[];


// configuration ===============================================================
mongoose.connect('mongodb://localhost:27017'); // connect to our database

 require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./config/netserver.js')(ns,io,info,clients);
require('./app/routes.js')(app, passport,io,info,ns,clients); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
ns.listen(8081,"0.0.0.0");
server.listen(3000,'0.0.0.0');

console.log('The magic happens on port ' + 3000);