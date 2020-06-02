
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const app = express();
const EV = require(__dirname + "/email_verification.js")
const AM = require(__dirname + "/account_manager.js")
const session = require('express-session')
const EMAIL_SECRET = 'asdf1093KMnzxcvnkljvasdu09123nlasdasdf';
const phonesData = require(__dirname + "/cell_phone_data.json");
const cookieParser = require('cookie-parser')
const fetch = require("node-fetch")
const { stringify } = require('querystring');
var Request = require("request");
const _ = require("lodash");



// redirect the user to login page if he didn't log in // 
const redirectLogin = (req, res, next) => {
    if (!req.session.user) {
        console.log(req.session.user)
        console.log(req.cookies.RememberMe + "cookies")

        res.redirect('/sign-in')
    } else {
        next();
    }
}

const redirectHome = (req, res, next) => {
    if (req.session.user) {
        console.log(req.session.user)
        console.log(req.cookies + "cookies")
        res.redirect('/dashboard')
    } else {
        next();
    }
}

app.use(bodyParser.json());
app.use(express.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({
    urlencoded: true
}));

app.use('/public', express.static(__dirname + '/public'));

app.use(cookieParser());
app.use(session({
    key: 'user_sid',
    secret: '1123FfdSSs23335',
    resave: false,
    saveUninitialized: false,
}));

app.set('view engine', 'ejs');
app.get('/', function (req, res) {

    console.log(req.cookies.Rememeber)
    res.redirect(301, '/sign-in');

});



app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});


// function ensureAuthenticated(req, res, next) {
//     if (req.isAuthenticated()) { return next(); }
//     res.redirect('/login')
// }



var passport = require('passport')
    , FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: '978507335946498',
    clientSecret: '6680fb4eb4e4a3879b51a94e966ac353',
    callbackURL: "http://cspproject.herokuapp.com/auth/facebook/callback",
    profileFields : ['id', 'displayName', 'email']

},
    function (accessToken, refreshToken, profile, done) {
            var User= { ID: profile.id, Name: profile.displayName, } 
           console.log(profile) 
        

    }
));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/sign-in',
        failureRedirect: '/login'
    }));

app.get('/auth/facebook',   
    passport.authenticate('facebook', { scope: 'read_stream' })
);

app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['read_stream', 'publish_actions'] })
);





//    sign-in      //
app.get('/sign-in', redirectHome, function (req, res) {
    if (req.cookies.RememberMe != null) {
        AM.automaticLogin(req.cookies.RememberMe[0], req.cookies.RememberMe[1], function (result, user) {

            if (result == 200) {
                req.session.user = purchaseJson = JSON.parse(JSON.stringify(user[0]))
                console.log(req.session.user)
                res.redirect(301, '/dashboard');
            }
            else {
                res.clearCookie('RememberMe')
                // res.sendFile(__dirname + '/views/sign-in.html');
                res.render('sign-in', { err: req.session.error });
            }

        })
    } else {
        // res.sendFile(__dirname + '/views/sign-in.html');
        res.render('sign-in', { err: req.session.error });
    }

});


app.post('/sign-in', function (req, res) {
    var recaptcha_url = "https://www.google.com/recaptcha/api/siteverify?";
    const secretKey = '6LfsdP0UAAAAANR9olaXiXnk7mPZwOMbh-TYFJ4x';
    recaptcha_url += "secret=" + secretKey + "&";
    recaptcha_url += "response=" + req.body["g-recaptcha-response"] + "&";
    recaptcha_url += "remoteip=" + req.connection.remoteAddress;
    Request(recaptcha_url, function (error, resp, body) {
        body = JSON.parse(body);
        if (body.success !== undefined && !body.success) {
            res.redirect('/sign-in');
        }
    });

    var email = req.body.email;
    var password = req.body.password;

    AM.checkLogin(email, password, function (err, result) {
        if (err) {
            console.log(err);
            res.render('sign-in', { email: email, password: password, error: 'This Email or Password does not match any account' })
        } else {
            if (result) {
                req.session.user = result;
                if (req.session.user.active == 1) {
                    /*checks if the user checked remember me*/
                    if (req.body.checkbox) {
                        console.log(req.body.checkbox);
                        res.cookie('RememberMe', [req.session.user.Email, req.session.user.Password])
                    }
                    res.redirect(301, '/dashboard');
                } else {

                    console.log("please confirm your email");
                    res.render('sign-in', { email, password, error: 'This Email or Password does not match any account' })
                }
            } else {
                console.log('if2')
                res.render('sign-in', { email: email, password: password, error: 'This Email or Password does not match any account' })



            }
        }
    })
});

//    sign-up      //

app.get('/sign-up', redirectHome, function (req, res) {
    res.render('sign-up');
});

app.get('/thank-you', function (req, res) {
    res.sendFile(__dirname + '/views/thank-you.html');
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

    var promoCode = req.body.promocode;
    if (promoCode) {
        AM.checkPromoCode(promoCode, function (response) {
            if (response == 500) {
                //promo code does not exist in the the database
                return;
            }
        });
    }


    AM.addNewAccount(newUser, function (status) {
        if (status === 500) {
            console.log("Failed to add user");
        } else if (status === 0) {
            console.log("user already exist");
            res.render('sign-up', {
                firstname: newUser.firstName, lastname: newUser.firstName, email: newUser.email,
                password: newUser.password, confirmpassword: req.body.confirmPass, error: 'This email is already exist'
            });
        } else {
            console.log("user added succesfuly");
            res.redirect(301, '/thank-you');
        }
    });

});

app.post('/logout', function (req, res) {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard')
        }
        res.clearCookie('RememberMe')
        res.redirect('/sign-in');
    })

});

app.post('/change-password', function (req, res) {


    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    var passwordchanged = [];
    var currentPass = (req.session.user.Password)

    AM.checkPassword(oldPassword, currentPass, function (resultCheckManager, err) {
        if (err === 500) {
            console.log('passwords does not match')
        }
        else {
            AM.updatePassword(newPassword, req.session.user.ID, function (result) {
                if (result == 200) {
                    emailToConfirm = req.session.user.Email
                    EV.PasswordUpdateConfirmation(emailToConfirm)
                    if (req.cookies.RememberMe != null)
                        res.clearCookie('RememberMe')
                    passwordchanged.push('Password has been changed successfuly');
                }
            })

            AM.fetchPurchasesData(function (result) {
                purchaseJson = JSON.parse(JSON.stringify(result))
                AM.fetchData(req.session.user.Email, function (err, result) {
                    userData = JSON.parse(JSON.stringify(result))
                    return res.render('profile', { user: userData, phones: phonesData, purchases: purchaseJson, passwordchanged });
                })

            })



        }
    })
});

app.get('/email-confirmation/:token', async (req, res) => {
    try {
        const decryptedData = jwt.verify(req.params.token, EMAIL_SECRET);
        console.log(decryptedData.newEmail);
        console.log(decryptedData.ID);
        AM.updateEmail(decryptedData.newEmail, decryptedData.ID)
        res.clearCookie('RememberMe')
        res.redirect('/sign-in');
    } catch (e) {
        res.send('error');
    }


});

app.get('/confirmation/:token', async (req, res) => {
    try {
        const email = jwt.verify(req.params.token, EMAIL_SECRET);
        console.log(email);
        AM.emailConfirmed(email.confirmedEmail);
    } catch (e) {
        res.send('error');
    }

    return res.redirect('/sign-in');
});


app.get('/dashboard', redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))
        res.render('dashboard', { user: userName, phones: phonesData, purchases: purchaseJson });
    });
});



//---------------------- buy cell phone -------------------------

app.get('/buy-cell-phone', redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))
        res.render('buyphone', { user: userName, phones: phonesData, purchases: purchaseJson });
    })
});


app.post('/buy-cell-phone', function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.addPurchase(req.body, req.session.user, function (status, result) {
        if (status === 500) {
            res.redirect(301, '/buy-cell-phone');
        } else {
            res.redirect(301, '/payment-success');
        }
    });
})

app.get('/payment-success', function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))
        res.render('payment-success', { user: userName, phones: phonesData, purchases: purchaseJson });
    })
});



//---------------------- profile -------------------------
app.get('/profile', redirectLogin, function (req, res) {

    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))

        AM.fetchData(req.session.user.Email, function (err, result) {
            userData = JSON.parse(JSON.stringify(result))
            res.render('profile', { user: userData, phones: phonesData, purchases: purchaseJson });
        })

    })
    // res.render('profile', { user: userJson, phones: phonesData });
});


app.get('/reset-password/:token', async (req, res) => {
    try {

        console.log('ffsdff')
        res.clearCookie('RememberMe')
        res.render('reset-password', { token: req.params.token });
    } catch (e) {
        res.send('error');
    }
});

app.post('/reset-password/:token', async (req, res) => {
    try {
        const decryptedData = jwt.verify(req.params.token, EMAIL_SECRET);
        var userEmail = decryptedData.userEmail
        var newPass = req.body.newpassword;
        var confirmPass = req.body.confirmpassword;
        AM.emailExist(userEmail, function (result) {
            if (result === 200) {
                if (newPass === confirmPass) {
                    AM.updateNewPassword(newPass, userEmail, function (result) {
                        if (result === 200) {
                            console.log('Password has been updated succeffuly')
                            return res.redirect('/sign-in');
                        }
                        else {
                            console.log('something went wrong')

                        }
                    })
                }
            }

        })


    } catch (e) {
        res.send('error');
    }
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
    var UserInfo = [
        req.session.user.FirstName,
        req.session.user.LastName,
        req.session.user.PhoneNumber,
        req.session.user.Country,
        req.session.user.City,
        req.session.user.Street,
        req.session.user.ZipCode,
        req.session.user.ID
    ];

    var messages = []

    if (!_.isEqual(UserInfo, newUserInfo)) {
        AM.updateUserInfo(newUserInfo, function (err, result) {
            if (result) {
                var string = JSON.stringify(result);
                var userJson = JSON.parse(string);
                emailToConfirm = req.session.user.Email
                EV.dataUpdateConfirmation(emailToConfirm, req.session.user.ID)
                console.log('changing your data!')
                messages.push('your data has been updated successfuly');
            }
        });
    }
    if (req.session.user.Email !== req.body.email) {
        var email = req.body.email;
        var ID = req.session.user.ID
        AM.emailExist(email, function (result) {
            console.log(result)
            if (result === 200) {
                var string = JSON.stringify(req.session.user);
                var userJson = JSON.parse(string);
                messages.push('the email you entered is already exist')
            }
            if (result === 300) {
                EV.emailUpdateActivation(email, ID)
                messages.push('Please confirm your new email by clicking on the link that we are sending to you these moments')
            }
        })
    }



    AM.fetchPurchasesData(function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))

        AM.fetchData(req.session.user.Email, function (err, result) {
            userData = JSON.parse(JSON.stringify(result))
            return res.render('profile', { user: userData, phones: phonesData, purchases: purchaseJson, messages });
        })

    })

});
app.get('/forgot-password', function (req, res) {
    res.sendFile(__dirname + "/views/forgot-password.html")
})



app.post('/forgot-password', function (req, res) {


    var email = req.body.email;
    EV.forgetPassword(email, function (status) {
        if (status) {
            res.redirect(301, 'thank-you');
        } else {
            console.log('ERROR sending an email')
        }
    });
});


//---------------------- about -------------------------
app.get('/about', redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))
        res.render('about', { user: userName, phones: phonesData, purchases: purchaseJson });
    })
});


app.get('/buy-pc', redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))
        res.render('coming-soon', { user: userName, phones: phonesData, purchases: purchaseJson });
    })
});


app.get('*', function (req, res) {
    res.sendfile(__dirname + '/views/404.html')
});


app.get('/.well-known', function(res, req){
    res.sendfile(__dirname + '/.well-known/pki-validation/8F7BBC9A0E320E84FC8B107F547CBBBA.txt');
})


const port = process.env.PORT || 5000;
const host = "localhost";


app.listen(process.env.PORT || 4000, () => {

    console.log('server running on http://' + host + ':' + port + '/');
});



