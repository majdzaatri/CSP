require("dotenv").config({ path: '.env' });
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const app = express();
const EV = require(__dirname + "/email_verification.js");
const AM = require(__dirname + "/account_manager.js");
const session = require("express-session");
const phonesData = require(__dirname + "/cell_phone_data.json");
const cookieParser = require("cookie-parser");
const fetch = require("node-fetch");
const { stringify } = require("querystring");
const _ = require("lodash");

var Request = require("request");
const EMAIL_SECRET = process.env.EMAIL_SECRET;

// redirect the user to login page if he didn't log in // 
const redirectLogin = (req, res, next) => {
    if (!req.session.user) {
        console.log("user.session :" + req.session.user);
        console.log("cookies.RememberMe :" + req.cookies.RememberMe);
        res.redirect("/sign-in");
    } else {
        next();
    }
}

// redirect the user to dashboard page when he did log in//
const redirectHome = (req, res, next) => {
    if (req.session.user) {
        console.log("user.session :" + req.session.user);
        console.log("cookies :" + req.cookies);
        res.redirect("/dashboard");
    } else {
        next();
    }
}

///////////// app.use  //////////////////
app.use(bodyParser.json());
app.use(express.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({urlencoded: true}));
app.use("/public", express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(session({
    key: "user_sid",
    secret: "1123FfdSSs23335",
    resave: false,
    saveUninitialized: false,
}));
app.set("view engine", "ejs");

//////////////////////////////////////////////////// start routing ////////////////////////////////////////////////////

app.get("/", function (req, res) {
    res.redirect(301, "/sign-in");
});


/////////////    logout     ////////////

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.post("/logout", function (req, res) {
    req.session.destroy(err => {
        if (err) {
            return res.redirect("/dashboard");
        }
        res.clearCookie("RememberMe");
        res.redirect("/sign-in");
    });
});


//////////////    sign-in      /////////////

app.get("/sign-in", redirectHome, function (req, res) {

    if (req.cookies.RememberMe != null) {
        AM.automaticLogin(req.cookies.RememberMe[0], req.cookies.RememberMe[1], function (result, user) {
            
            //if email and password exist redirect to dashboard page else send an error message
            if (result == 200) {
                req.session.user = purchaseJson = JSON.parse(JSON.stringify(user[0]));
                res.redirect(301, "/dashboard");
            }
            else {
                res.clearCookie("RememberMe");
                res.render("sign-in", { err: req.session.error });
            }
        });
    } else {
        res.render("sign-in", { err: req.session.error });
    }
});


app.post("/sign-in", function (req, res) {

    //////////////////////////// TO DO: Move recaptcha part to external js file
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    var recaptcha_url = "https://www.google.com/recaptcha/api/siteverify?";
    recaptcha_url += "secret=" + secretKey + "&";
    recaptcha_url += "response=" + req.body["g-recaptcha-response"] + "&";
    recaptcha_url += "remoteip=" + req.connection.remoteAddress;
    Request(recaptcha_url, function (error, resp, body) {
        body = JSON.parse(body);
        if (body.success !== undefined && !body.success) {
            res.redirect("/sign-in");
        }
    });

    const email = req.body.email;
    const password = req.body.password;

    AM.checkLogin(email, password, function (err, result) {
        if (err) {
            console.log("ERROR :" + err);
            res.render("sign-in", { email: email, password: password, error: "An error occurred, please try again later" });
        } else {
            if (result) {
                req.session.user = result;
                if (req.session.user.active == 1) {
                    /*checks if the user checked remember me*/
                    if (req.body.checkbox) {
                        res.cookie("RememberMe", [req.session.user.Email, req.session.user.Password]);
                    }
                    res.redirect(301, "/dashboard");
                } else {
                    res.render("sign-in", { email, password, error: "You have to activate your email address first, please check your email" })
                }
            } else {
                res.render("sign-in", { email: email, password: password, error: "This Email or Password does not match any account" })
            }
        }
    });
});


//////////////////    sign-up      ///////////////////

app.get("/sign-up", redirectHome, function (req, res) {
    console.log("Email :" + process.env.EMAIL);
    console.log("Password :" + process.env.PASS);
    res.render("sign-up");
});


app.post("/sign-up", function (req, res) {
    var newUser = {
        firstName: req.body.firstname,
        lastName: req.body.lastname,
        email: req.body.email,
        password: req.body.password,
        promoCode: req.body.promocode ? req.body.promocode : null,
        active: 0
    };
    var prommoError;
    var error;
    
    if (newUser.promoCode) {
        AM.checkPromoCode(newUser.promoCode, function (response) {
            if (response == 500) {
                prommoError = "Promo code does not exist!";
                //promo code does not exist in the the database
                res.render("sign-up", {
                    firstname: newUser.firstName, lastname: newUser.firstName, email: newUser.email,
                    password: req.body.password, confirmpassword: req.body.confirmPass, error, prommoError
                });
            }
        });
    }
    AM.addNewAccount(newUser, function (status) {
        if (status === 500) {
            console.log("Failed to add user");
        } else if (status === 0 || promostatus) {
            if (status===0){
                error= "This email is already exist";
            }
            console.log("user already exist");
            res.render("sign-up", {
                firstname: newUser.firstName, lastname: newUser.firstName, email: newUser.email,
                password: req.body.password, confirmpassword: req.body.confirmPass, error, prommoError
            });
        } else {
            console.log("user added succesfuly");
            res.redirect(301, "/thank-you");
        }
    });
});

//////////////////    thank-you      ///////////////////

app.get("/thank-you", function (req, res) {
    res.sendFile(__dirname + "/views/thank-you.html");
});

//////////////////    change-password      ///////////////////

app.post("/change-password", function (req, res) {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    var passwordchanged = [];
    const currentPass = req.session.user.Password;

    AM.checkPassword(oldPassword, currentPass, function (resultCheckManager, err) {
        if (err === 500) {
            console.log("passwords does not match");
        } else {
            AM.updatePassword(newPassword, req.session.user.ID, function (result) {
                if (result == 200) {
                    emailToConfirm = req.session.user.Email;
                    EV.PasswordUpdateConfirmation(emailToConfirm);
                    if (req.cookies.RememberMe != null)
                        res.clearCookie("RememberMe");
                    passwordchanged.push("Password has been changed successfuly");
                }
            });

            // TO DO: Move these lines to a function
            AM.fetchPurchasesData(req.session.user.Email,function (result) {
                purchaseJson = JSON.parse(JSON.stringify(result));
                AM.fetchData(req.session.user.Email, function (err, result) {
                    userData = JSON.parse(JSON.stringify(result));
                    return res.render("profile", { user: userData, phones: phonesData, purchases: purchaseJson, passwordchanged });
                });
            });
        }
    });
});


//////////////////    email-confirmation      ///////////////////

app.get("/email-confirmation/:token", async (req, res) => {
    try {
        const decryptedData = jwt.verify(req.params.token, EMAIL_SECRET);
        AM.updateEmail(decryptedData.newEmail, decryptedData.ID);
        res.clearCookie("RememberMe");
        res.redirect("/sign-in");
    } catch (err) {
        res.send("Error :" + err);
    }
});


//////////////////    confirmation      ///////////////////

app.get("/confirmation/:token", async (req, res) => {
    try {
        const email = jwt.verify(req.params.token, EMAIL_SECRET);
        AM.emailConfirmed(email.confirmedEmail);
    } catch (err) {
        res.send("Error :" + err);
    }
    return res.redirect("/sign-in");
});


//////////////////    dashboard      ///////////////////

app.get("/dashboard", redirectLogin, function (req, res) {

        let userName = req.session.user.FirstName + " " + req.session.user.LastName;
        AM.fetchPurchasesData(req.session.user.Email, function (result) {
            purchaseJson = JSON.parse(JSON.stringify(result));
            req.session.user.phonesPurchases = purchaseJson;
            res.render("dashboard", { user: userName, phones: phonesData, purchases: req.session.user.phonesPurchases });
        });
});


//////////////////    buy-cell-phone      ///////////////////

app.get("/buy-cell-phone", redirectLogin, function (req, res) {

    let userName = req.session.user.FirstName + " " + req.session.user.LastName;
    res.render("buyphone", { user: userName, phones: phonesData, purchases: req.session.user.phonesPurchases });
});

app.post("/buy-cell-phone", function (req, res) {
    AM.addPurchase(req.body, req.session.user, function (status, result) {
        if (status === 500) {
            res.redirect(301, "/buy-cell-phone");
        } else {
            res.redirect(301, "/payment-success");
        }
    });
});


//////////////////    payment-success      ///////////////////

app.get("/payment-success", function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(req.session.user.Email,function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result));
        res.render("payment-success", { user: userName, phones: phonesData, purchases: purchaseJson });
    })
});


//////////////////    profile      ///////////////////

app.get("/profile", redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(req.session.user.Email,function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result));
        AM.fetchData(req.session.user.Email, function (err, result) {
            userData = JSON.parse(JSON.stringify(result));
            res.render("profile", { user: userName, userData: userData, phones: phonesData, purchases: purchaseJson });
        });
    });
});


//////////////////    reset-password      ///////////////////

app.get("/reset-password/:token", async (req, res) => {
    try {
        res.clearCookie("RememberMe")
        res.render("reset-password", { token: req.params.token });
    } catch (e) {
        res.send("error");
    }
});

app.post("/reset-password/:token", async (req, res) => {
    try {
        const decryptedData = jwt.verify(req.params.token, EMAIL_SECRET);
        const userEmail = decryptedData.userEmail;
        const newPass = req.body.newpassword;
        const confirmPass = req.body.confirmpassword;

        AM.emailExist(userEmail, function (result) {
            if (result === 200) {
                if (newPass === confirmPass) {
                    AM.updateNewPassword(newPass, userEmail, function (result) {
                        if (result === 200) {
                            console.log("Password has been updated successfully");
                            return res.redirect("/sign-in");
                        }
                        else {
                            console.log("something went wrong");
                        }
                    });
                }
            }
        });
    } catch (e) {
        res.send("error");
    }
});


//////////////////    profileInfo      ///////////////////

app.post("/profileInfo", function (req, res) {

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
                emailToConfirm = req.session.user.Email;
                messages.push("Your data has been updated successfully");
                EV.dataUpdateConfirmation(emailToConfirm, req.session.user.ID);
            }
        });
    }

    if (req.session.user.Email !== req.body.email) {
        const email = req.body.email;
        const ID = req.session.user.ID
        AM.emailExist(email, function (result) {
            if (result === 200) {
                messages.push("the email you entered is already exist");
            }else if (result === 300) {
                EV.emailUpdateActivation(email, ID);
                messages.push("Please confirm your new email by clicking on the link that we are sending to you these moments");
            }
        })
    }

    AM.fetchPurchasesData(req.session.user.Email,function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))

        AM.fetchData(req.session.user.Email, function (err, result) {
            userData = JSON.parse(JSON.stringify(result))
            console.log(messages)
            return res.render("profile", { user: userData, phones: phonesData, purchases: purchaseJson, messages });
        });
    });
});


//////////////////    forgot-password      ///////////////////

app.get("/forgot-password", function (req, res) {
    res.sendFile(__dirname + "/views/forgot-password.html");
});

app.post("/forgot-password", function (req, res) {
    const email = req.body.email;
    EV.forgetPassword(email, function (status) {
        if (status) {
            res.redirect("/thank-you");
        } else {
            console.log("ERROR sending an email");
        }
    });
});


//////////////////    about      ///////////////////

app.get("/about", redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(req.session.user.Email,function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))
        res.render("about", { user: userName, phones: phonesData, purchases: purchaseJson });
    })
});


//////////////////    buy-pc      ///////////////////

app.get("/buy-pc", redirectLogin, function (req, res) {
    var string = JSON.stringify(req.session.user);
    var userJson = JSON.parse(string);
    let userName = userJson.FirstName + " " + userJson.LastName;
    AM.fetchPurchasesData(req.session.user.Email,function (result) {
        purchaseJson = JSON.parse(JSON.stringify(result))
        res.render("coming-soon", { user: userName, phones: phonesData, purchases: purchaseJson });
    })
});


//////////////////    * - other      ///////////////////

app.get("*", function (req, res) {
    res.sendfile(__dirname + "/views/404.html")
});


const port = process.env.PORT;
const host = "localhost";

app.listen(port, () => {
    console.log("server running on http://" + host + ":" + port + "/");
});