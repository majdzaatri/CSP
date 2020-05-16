const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({urlencoded: true}));
app.use('/public', express.static(__dirname+'/public'));

app.get('/', function(req,res){
    res.redirect(301, '/sign-in');
});

app.get('/sign-in', function(req,res){
    res.sendFile(__dirname + '/views/sign-in.html');
});

app.get('/sign-up', function(req,res){
    res.sendFile(__dirname + '/views/sign-up.html');
});

app.get('/reset-password', function(req,res){
    res.sendFile(__dirname + '/views/reset-password.html');
});

app.get('/dashboard', function(req,res){
    res.sendFile(__dirname + '/views/dashboard.html');
});

const port = "8000";
const host = "localhost";

const server = app.listen(port, host, () => {
    console.log('server running on http://' + host + ':' + port + '/');
});