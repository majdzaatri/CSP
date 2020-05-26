
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const app = express();
const AM = require(__dirname + "/account_manager.js")
const session = require('express-session')
const EMAIL_SECRET = 'asdf1093KMnzxcvnkljvasdu09123nlasdasdf';
const phonesData = require(__dirname + "/cell_phone_data.json");


// redirect the user to login page if he didn't log in // 
const redirectLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect('/sign-in')
    } else {
        next();
    }
}

const redirectHome = (req, res, next) => {
    if (req.session.user) {

        res.redirect('/dashboard')
    } else {
        next();
    }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    urlencoded: true
}));

app.use('/public', express.static(__dirname + '/public'));


app.use(session({
    key: 'user_sid',
    secret: '1123FfdSSs23335',
    resave: false,
    saveUninitialized: false,
}));

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.redirect(301, '/sign-in');
});



//    sign-in      //
app.get('/sign-in', redirectHome, function (req, res) {
    res.sendFile(__dirname + '/views/sign-in.html');
});

app.post('/sign-in', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    AM.checkLogin(email, password, function (err, result) {
        if (err) {
            res.redirect(301, '/sign-in');
        } else {
            if (result) {
                req.session.user = result;
                if (req.session.user.active === 1) {
                    res.redirect(301, '/dashboard');
                } else {
                    console.log("please confirm your email");
                }
            } else {
                res.redirect(301, '/sign-in');
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
        promoCode: req.body.promocode ? req.body.promocode : null,
        active: 0
    };

    AM.addNewAccount(newUser, function (status) {
        if (status === 500) {
            console.log("Failed to add user");
        } else if (status === 0) {
            console.log("user already exist");
            res.redirect(301, '/sign-up');
        } else {
            console.log("user added succesfuly");
            res.redirect(301, '/dashboard');
        }
    });

});

app.post('/logout', function (req, res) {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard')
        }
        res.redirect('/sign-in');
    })

});

app.post('/change-password', function (req, res) {


    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;

    var currentPass = (req.session.user.Password)

    AM.checkPassword(oldPassword, currentPass, function (resultCheckManager, err) {
        if (err === 500) {
            console.log('passwords does not match')
        }
        else {
            AM.updatePassword(newPassword, req.session.user.ID, function (result) {
                if (res == 200) {
                    console.log('password has been updated successfully')
                }
            })
            return res.redirect('/profile')

        }
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

    return res.redirect('/sign-in');
});


app.get('/reset-password', function (req, res) {
    res.sendFile(__dirname + '/views/reset-password.html');
});

app.get('/dashboard', redirectLogin, function (req, res) {
    //let name = document.getElementById('last name')
    // res.sendFile(__dirname + '/views/dashboard.html');
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    res.render('dashboard', { user: userName });
});



//---------------------- buy cell phone -------------------------

app.get('/buy-cell-phone', redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    res.render('buyphone', { user: userName, phones: phonesData });
});




//---------------------- profile -------------------------
app.get('/profile', redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    // let userName = userJson.FirstName + " " + userJson.LastName;
    res.render('profile', { user: userJson });
});

app.post('/profileInfo', function (req, res) {

    var newUserInfo = [
        req.body.firstname,
        req.body.lastname,
        req.body.phonenumber ? req.body.phonenumber : null,
        req.body.country ? req.body.country : null,
        req.body.City ? req.body.City : null,
        req.body.Street ? req.body.Street : null,
        req.body.Zipcode ? req.body.Zipcode : null,
        req.session.user.ID
    ];

    AM.updateUserInfo(newUserInfo, function (err, result) {
        if (result) {
            req.session.user = result;
            if (req.session.user.active === 1) {
                res.redirect(301, '/profile');
            }
        }
    });
});


//---------------------- about -------------------------
app.get('/about', redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    res.render('about', { user: userName });
});




const port = process.env.PORT || 8000;
const host = "localhost";

app.listen(process.env.PORT || 8000, () => {
    console.log('server running on http://' + host + ':' + port + '/');
});



