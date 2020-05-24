
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const AM = require(__dirname + "/account_manager.js")
const session = require('express-session')
const EMAIL_SECRET = 'asdf1093KMnzxcvnkljvasdu09123nlasdasdf';

 // redirect the user to login page if he didn't log in // 
const redirectLogin  = (req, res, next) =>{
    if(!req.session.user){
        res.redirect('/sign-in')
    } else {
        next();
    }
}

const redirectHome  = (req, res, next) =>{
    if(req.session.user){

        res.redirect('/dashboard')
    } else {
        next();
    }
}

app.use(bodyParser.urlencoded({
    urlencoded: true
}));

app.use('/public', express.static(__dirname + '/public'));

app.use(session({
    key: 'user_sid',
    secret: '1123FfdSSs23335',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));


app.get('/', function (req, res) {
    res.redirect(301, '/sign-in');
});



//    sign-in      //
app.get('/sign-in',redirectHome, function (req, res) {

    res.sendFile(__dirname + '/views/sign-in.html');
});

app.post('/sign-in', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    
    AM.checkLogin(email, password, function(err, result){
        if(err){
            res.redirect(301,'/sign-in');
        } else {
            if(result){
                req.session.user = result
                if(req.session.user.active===1){
                res.redirect(301,'/dashboard');
                } else{
                    console.log("please confirm your email");
                }
            }else{
                res.redirect(301,'/sign-in');
            }
        }
    })
});

//    sign-up      //

app.get('/sign-up', redirectHome, function (req, res) {
    res.sendFile(__dirname + '/views/sign-up.html');
});

app.post('/sign-up', function (req, res) {

    var newUser = {
    firstName: req.body.firstname,
    lastName: req.body.lastname,
    email: req.body.email,
    password: req.body.password,
    promoCode: req.body.promocode? req.body.promocode : null,
    active:0
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
    });

});

app.post('/logout', function (req, res) {
    req.session.destroy(err => {
       if(err){
        return res.redirect('/dashboard')
       }
       res.redirect('/sign-in');
    })

});

app.get('/confirmation/:token', async (req, res) => {
    try {
      const email = jwt.verify(req.params.token, EMAIL_SECRET);
      console.log(email.user);
      AM.emailConfirmed(email);
      console.log("confirmed");
    } catch (e) {
      res.send('error');
    }
  
    return res.redirect('http://localhost:8000/sign-in');
});


app.get('/reset-password', function (req, res) {
    res.sendFile(__dirname + '/views/reset-password.html');
});

app.get('/dashboard',redirectLogin, function (req, res) {
    //let name = document.getElementById('last name')
    res.sendFile(__dirname + '/views/dashboard.html');
});

app.get('/buy-cell-phone',redirectLogin, function(req,res){
    res.sendFile(__dirname + '/views/buyphone.html');
});

app.get('/profile',redirectLogin, function(req,res){
    res.sendFile(__dirname + '/views/profile.html');
});

app.get('/about',redirectLogin, function(req,res){
    res.sendFile(__dirname + '/views/about.html');
});




const port = 3000;
const host = "localhost";

const server = app.listen(process.env.PORT, host, () => {
    console.log('server running on http://' + host + ':' + port + '/');
});


