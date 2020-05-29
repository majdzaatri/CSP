
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
const Request = require("request");
var isEqual = require('lodash.isequal');
const _ = require('lodash')




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



//    sign-in      //
app.get('/sign-in', function (req, res) {
    if (req.cookies.RememberMe != null) {
        AM.automaticLogin(req.cookies.RememberMe[0], req.cookies.RememberMe[1], function (result, user) {
            if (result == 200) {
                req.session.user = user;
                res.redirect(301, '/dashboard');
            }
            else {
                res.clearCookie('RememberMe')
                res.sendFile(__dirname + '/views/sign-in.html');
            }

        })
    } else {
        res.sendFile(__dirname + '/views/sign-in.html');
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
            return res.send({ "message": "Captcha validation failed" });
        }
    });

    var email = req.body.email;
    var password = req.body.password;

    AM.checkLogin(email, password, function (err, result) {
        if (err) {
            res.redirect(301, '/sign-in');
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

app.get('/thank-you', function (req, res) {
    res.sendFile(__dirname + '/views/thank-you.html');
});


app.post('/sign-up', function (req, res) {

    var recaptcha_url = "https://www.google.com/recaptcha/api/siteverify?";
    const secretKey = '6LfsdP0UAAAAANR9olaXiXnk7mPZwOMbh-TYFJ4x';
    recaptcha_url += "secret=" + secretKey + "&";
    recaptcha_url += "response=" + req.body["g-recaptcha-response"] + "&";
    recaptcha_url += "remoteip=" + req.connection.remoteAddress;
    Request(recaptcha_url, function (error, resp, body) {
        body = JSON.parse(body);
        if (body.success !== undefined && !body.success) {
            return res.send({ "message": "Captcha validation failed" });
        }
    });
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
        console.log('adddd')
        AM.addNewAccount(newUser, function (status) {
            if (status === 500) {
                console.log("Failed to add user");
            } else if (status === 0) {
                console.log("user already exist");
                res.redirect(301, '/sign-up');
            } else {
                console.log("user added succesfuly");
                res.redirect(301, '/thank-you');
            }

        })

    
})

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
                        if (req.cookies.RememberMe != null) {
                            res.clearCookie('RememberMe')
                            return res.redirect('/profile')
                        } else {
                            return res.redirect('/profile')
                        }
                    }
                    else {
                        return res.redirect('/profile')
                    }
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



    app.get('/reset-password', function (req, res) {
        res.sendFile(__dirname + '/views/reset-password.html');
    });

    app.get('/dashboard', redirectLogin, function (req, res) {
        //let name = document.getElementById('last name')
        // res.sendFile(__dirname + '/views/dashboard.html');
        var string = JSON.stringify(req.session.user);
        var userJson = JSON.parse(string);
        let userName = userJson.FirstName + " " + userJson.LastName;
        res.render('dashboard', { user: userName, phones: phonesData });
        // if(userJson[0]){
        //     var userName = userJson[0].FirstName + " " + userJson[0].LastName;
        //     req.session.user=userJson[0];
        //    }
        //    else {
        //        var userName = userJson.FirstName + " " + userJson.LastName;
        //    }
        //    res.render('dashboard', { user: userName });
    });



    //---------------------- buy cell phone -------------------------

    app.get('/buy-cell-phone', redirectLogin, function (req, res) {
        var string = JSON.stringify(req.session.user);
        var userJson = JSON.parse(string);
        let userName = userJson.FirstName + " " + userJson.LastName;
        AM.fetchPurchasesData(function (result) {
            console.log(JSON.parse(JSON.stringify(result)))
            purchaseJson = JSON.parse(JSON.stringify(result))
            console.log(phonesData)
            console.log(result)
            res.render('buyphone', { user: userName, phones: phonesData, purchases: purchaseJson });
        })
    });


    app.post('/buy-cell-phone', redirectLogin, function (req, res) {
        var string = JSON.stringify(req.session.user);
        var userJson = JSON.parse(string);
        let userName = userJson.FirstName + " " + userJson.LastName;
        AM.addPurchase(req.body, req.session.user, function (status, result) {
            if (status === 500) {
                res.redirect(301, '/buy-cell-phone');
            } else {
                phonesPur = result;

                res.render('buyphone', { user: userName, phones: phonesData, purchases: res });
            }
        });
    })



    //---------------------- profile -------------------------
    app.get('/profile', redirectLogin, function (req, res) {
        var string = JSON.stringify(req.session.user);
        var userJson = JSON.parse(string);
        // let userName = userJson.FirstName + " " + userJson.LastName;
        res.render('profile', { user: userJson, phones: phonesData });
    });



    app.post('/profileInfo', function (req, res) {
        console.log('this Email is  exist!')

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

        console.log(UserInfo)
        console.log(newUserInfo)


        if (!_.isEqual(UserInfo, newUserInfo)) {
            AM.updateUserInfo(newUserInfo, function (err, result) {
                if (result) {
                    req.session.user = result;
                    res.redirect(301, '/profile');
                    emailToConfirm = req.session.user.Email
                    EV.dataUpdateConfirmation(emailToConfirm, req.session.user.ID)
                }
            });
        }
        if (req.session.user.Email !== req.body.email) {
            var email = req.body.email;
            var ID = req.session.user.ID
            if (AM.emailExist(email) === 200) {
                console.log('this Email is already exist!')
                res.redirect(301, '/profile');
            } else {
                console.log('changing email!!')
                EV.emailUpdateActivation(email, ID)
            }
        }




    });



    //---------------------- about -------------------------
    app.get('/about', redirectLogin, function (req, res) {
        var string = JSON.stringify(req.session.user);
        var userJson = JSON.parse(string);
        let userName = userJson.FirstName + " " + userJson.LastName;
        res.render('about', { user: userName, phones: phonesData });
    });



    app.get('*', function (req, res) {
        res.send('what???', 404);
    });


    const port = process.env.PORT || 8000;
    const host = "localhost";

    app.listen(process.env.PORT || 5000, () => {
        console.log('server running on http://' + host + ':' + port + '/');
    });



