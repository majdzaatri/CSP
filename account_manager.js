const crypto = require("crypto");
const mysql = require("mysql");

const EV = require(__dirname + "/email_verification.js")
const mydatabase = "heroku_98861de8c1925bc";


const connection = mysql.createConnection({
    host: "us-cdbr-east-06.cleardb.net",
    user: "b662e61354c88f",
    password: "d6548e95",
    database: mydatabase
});

//    sign-in queries      //
exports.checkLogin = function (email, password, callback) {
    let query = "SELECT * FROM users WHERE email = ?";

    connection.query(query, email, async function (err, rows, fields) {
        if (err) {
            console.log("Failed to check if email and password exist in DB: " + err);
            //TODO: check what we have to return in the callback if something failed
        } else {
            if (rows.length > 0) {
                let hashPass = rows[0].Password;

                validatePassword(password, hashPass, function (err, res) {
                    if (res) {
                        callback(null, rows[0]);

                    } else {
                        callback('invalid-password');
                    }
                });
            } else {
                console.log("email doesn't exist or password wrong!");
                callback('invalid-email');
            }
        }
    });
}


//    sign-up queries    //
exports.addNewAccount = function (newUser, callback) {
    let query = "SELECT COUNT(*) AS cnt FROM users WHERE email = ?";
    connection.query(query, newUser.email, function (err, data) {
        if (err) {
            console.log("Failed checking if email is already exist: " + err);
        } else {
            if (data[0].cnt > 0) {
                callback(0); //TODO: Check if it's OK
            } else {
                saltAndHash(newUser.password, function (hash) {
                    newUser.password = hash;
                    connection.query("INSERT INTO "+mydatabase+".`users` SET ?", newUser, function (err, res, fields) {
                        if (err) {
                            console.log("Failed to add new user: " + err);
                            callback(500); //TODO: Check if it's OK
                        } else {
                            console.log('sending email from account manager');
                            EV.sendConfirmation(newUser.email);
                            callback(200);
                        }
                    });
                })
            }
        }
    });
}




exports.emailConfirmed = function (email, callback) {
    let query = "UPDATE " + mydatabase + ".`users` SET `active` = '1' WHERE (`Email` = ?)";
    connection.query(query, email.user, function (err, data) {
        if (err) {
            console.log("Failed activating the account");
        } else {
            console.log("email confirmed successfuly");
        }
    });
}


//    encryption methods    //
var md5 = function (str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

var generateSalt = function () {
    var salt = '';
    var key = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * key.length);
        salt += key[p];
    }
    return salt;
}

var saltAndHash = function (pass, callback) {
    var salt = generateSalt();
    callback(salt + md5(pass + salt));
}

var validatePassword = function (plainPass, hashPass, callback) {
    var salt = hashPass.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    callback(null, hashPass === validHash);
}