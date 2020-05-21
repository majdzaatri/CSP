const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const AM = require(__dirname + "/account_manager.js")

app.use(bodyParser.urlencoded({
    urlencoded: true
}));
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.redirect(301, '/sign-in');
});

//    sign-in      //

app.get('/sign-in', function (req, res) {
    res.sendFile(__dirname + '/views/sign-in.html');
});

app.post('/sign-in', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    
    AM.checkLogin(email, password, function(o, err){
        if(err){
            res.status(400).send("error occured");
        } else {
            if(o){
                res.redirect(301,'/dashboard');
            }else{
                res.redirect(301,'/sign-in');
            }
        }
    })
})

//    sign-up      //

app.get('/sign-up', function (req, res) {
    res.sendFile(__dirname + '/views/sign-up.html');
});

app.post('/sign-up', function (req, res) {

    var newUser = {
    firstName: req.body.firstname,
    lastName: req.body.lastname,
    email: req.body.email,
    password: req.body.password,
    promoCode: req.body.promocode? req.body.promocode : null
    };

    AM.addNewAccount(newUser, function(status){
        if(status === 500){
            console.log("Failed to add user");
        } else if(status === 0){
            console.log("user already exist");
            res.redirect(301,'/sign-up');
        } else {
            console.log("user added succesfuly");
            res.redirect(301,'/dashboard');
        }
    })

})



app.get('/reset-password', function (req, res) {
    res.sendFile(__dirname + '/views/reset-password.html');
});

app.get('/dashboard', function (req, res) {
    res.sendFile(__dirname + '/views/dashboard.html');
});

const port = "8000";
const host = "localhost";

const server = app.listen(port, host, () => {
    console.log('server running on http://' + host + ':' + port + '/');
});