var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var db = require('./db');
var cors = require('cors')
var routes = require('./routes');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
//app.options('*', cors());
var port = process.env.PORT || 7000;        // set our port


// db.connect('mongodb://localhost:27017/catchletter', function (err) {
// db.connect('mongodb://178.128.176.48:27017/catchletter', function (err) {
//     if (err) {
//         console.log('Unable to connect to Mongo.')
//         process.exit(1)
//     } else {
//
//     }
// })
db.connect('mongodb://admin:Natit%402018@178.128.176.48:2222/catchletter', {
            uri_decode_auth: true
        }, function (err) {
    if (err) {
        console.log('Unable to connect to Mongo.')
        process.exit(1)
    } else {

    }
})
// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router


app.use(express.static('public'));
app.use('/resources', express.static(__dirname + '/screenshots'));
app.use('/image', express.static(__dirname + '/uploadUserImage'));
// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', routes);
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Listening on port ' + port);
