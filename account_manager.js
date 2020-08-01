const crypto = require("crypto");
const mysql = require("mysql");
const https = require("https");
const EV = require(__dirname + "/email_verification.js");
const phonesData = require(__dirname + "/cell_phone_data.json");
const mydatabase = "heroku_98861de8c1925bc";
const PORT = 4000;

const connection = mysql.createPool({
    connectionLimit: 10,
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
                    console.log(res)
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
                    connection.query("INSERT INTO " + mydatabase + ".`users` SET ?", newUser, function (err, res, fields) {
                        if (err) {
                            console.log("Failed to add new user: " + err);
                            callback(500); //TODO: Check if it's OK
                        } else {
                            console.log('sending email from account manager');
                            EV.sendConfirmation(newUser.email);
                            console.log('sending email from account manager');
                            callback(200);
                        }
                    });
                })
            }
        }
    });
}

exports.emailExist = function (email, callback) {
    let query = "SELECT COUNT(*) AS cnt FROM users WHERE email = ?";
    connection.query(query, email, function (err, data) {
        if (err) {
            console.log("Failed checking if email is already exist: " + err);
        } else {
            if (data[0].cnt > 0) {
                callback(200); //TODO: Check if it's OK
            }
            else{
                callback(300)
            }
        }
    });
}

// update profile queries //
exports.updateUserInfo = function (newUserInfo, callback) {

    let query = "UPDATE users SET FirstName = " + JSON.stringify(newUserInfo[0]) + ", LastName = " + JSON.stringify(newUserInfo[1]) + ", PhoneNumber = " + JSON.stringify(newUserInfo[2]) + ", Country = " + JSON.stringify(newUserInfo[3]) + ", City = " + JSON.stringify(newUserInfo[4]) + ",Street = " + JSON.stringify(newUserInfo[5]) + ",ZipCode = " + JSON.stringify(newUserInfo[6]) + " WHERE ID = " + newUserInfo[7];
    connection.query(query, function (err, result, fields) {
        if (err) {
            console.log("Failed update user: " + err);
        } else {
            console.log("updated user successfuly!");
            callback(result, result);
        }
    });
}


// add purchases queries //
exports.addPurchase = function (phoneDetails, user, callback) {
    console.log(phoneDetails);
    const phone = phoneDetails.phone;
    const model = phoneDetails.model;
    const phones = phonesData;
    const price = phones[phone].models[model].price;


    const url = "https://currencyapi.net/api/v1/rates?key=0kpdBfiRT9ktw04EApqJbDIx55SU7aHabaes"

    https.get(url, function (res) {

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {

            try {
                const parsedData = JSON.parse(rawData);
                const ilsRate = parsedData.rates.ILS;
                const priceInFloat = parseFloat(price.replace('$', ''));
                console.log(priceInFloat);
                const priceInIls = priceInFloat * ilsRate;
                data = [
                    phones[phone].id,
                    phones[phone].models[model].type,
                    user.Email,
                    price,
                    (priceInIls.toFixed(2)) + " ILS",
                    (priceInIls + (priceInIls * 0.17)).toFixed(2) + " ILS",
                    phoneDetails.cardNum,
                    phoneDetails.cardName,
                    phoneDetails.exp,
                    phoneDetails.cvv,
                    phoneDetails.cardMemo
                ]


                let query = "INSERT INTO `transactions` SET Product = ?, Model = ?, Date = NOW(), User = ?, Price = ?, LocalPrice = ?, TotalPriceIncludingVAT = ?, Number = ?, Name = ?, ExperationDate = ?, CVV = ?, Memo = ?";
                connection.query(query, data, function (err, res, fields) {
                    if (err) {
                        console.log("Failed to add purchase detail: " + err);
                        callback(500, null);
                    } else {
                        EV.sendPurchaseDetails(user, function (response) {
                            callback(response, res);
                        })
                    }
                })
            } catch (e) {
                console.error(e.message);
            }
        });
    })
}


exports.fetchPurchasesData = function (email,callback) {
    console.log(email);
    let query = "SELECT Product ,COUNT(*) AS cnt FROM transactions WHERE User=? GROUP BY Product";
    connection.query(query,[email],function (err, res) {
        console.log(res);
        if(res){
        callback(res);
        } else {
            console.log("errrrrrrr")
            callback(0);
        }
    })
}


exports.updatePassword = function (newPassword, ID, callback) {
    saltAndHash(newPassword, function (hash) {
        newPassword = hash;
        connection.query("UPDATE " + mydatabase + ".`users` SET Password = ? where ID = ?", [newPassword, ID], function (err, res, fields) {
            console.log(newPassword)
            if (err) {
                console.log("Failed to update password: " + err);
                callback(500); //TODO: Check if it's OK

            }
            else {
                console.log("Password has been updated successfully")
                callback(200);
            }

        });
    })
}



exports.updateNewPassword = function (newPassword, email, callback) {
    saltAndHash(newPassword, function (hash) {
        newPassword = hash;
        connection.query("UPDATE " + mydatabase + ".`users` SET Password = ? where Email = ?", [newPassword, email], function (err, res, fields) {
            console.log(newPassword)
            if (err) {
                console.log("Failed to update password: " + err);
                callback(500); //TODO: Check if it's OK

            }
            else {
                console.log("Password has been updated successfully")
                callback(200);
            }

        });
    })
}


exports.updateEmail = function (email, ID, callback) {
    let query = "UPDATE " + mydatabase + ".`users` SET `Email` = ? WHERE ID = ?";

    connection.query(query, [email, ID], function (err, data) {
        console.log(email)
        console.log(ID)
        if (err) {
            console.log("Failed activating the account");
        } else {
            console.log("email confirmed successfuly");
        }
    });
}

exports.emailConfirmed = function (email, callback) {
    let query = "UPDATE " + mydatabase + ".`users` SET `active` = '1' WHERE (`Email` = ?)";
    connection.query(query, email, function (err, data) {
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

exports.checkPassword = function (enteredPassword, password, callback) {

    validatePassword(enteredPassword, password, function (err, res) {
        if (res) {
            callback(null, 200);
        }
        else {
            callback(err, 500);
        }
    })
}

//    sign-in queries      //
exports.automaticLogin = function (email, password, callback) {
    let query = "SELECT * FROM users WHERE email = ?";

    connection.query(query, email, async function (err, rows, fields) {
        if (err) {
            console.log("Failed to check if email and password exist in DB: " + err);
            //TODO: check what we have to return in the callback if something failed
        } else {
            if (rows.length > 0) {
                let hashPass = rows[0].Password;
                if (password == hashPass) {
                    callback(200, rows);
                }

            } else {
                console.log("email doesn't exist or password wrong!");
                callback(500);
            }
        }
    });
}

exports.checkPromoCode = function (promoCode, callback) {

    let query = "SELECT * FROM promocode WHERE promocode = ?";

    connection.query(query, promoCode, async function (err, rows, fields) {
        if (err) {
            console.log("Failed to check if promo code exist " + err);
            //TODO: check what we have to return in the callback if something failed
        } else {

            if (rows.length > 0) {
                let hashPass = rows[0].promocode;
                callback(200);
                console.log('Promo code is exist!')
            }

            else {
                console.log("Promo Code doesn't exist!");
                callback(500);
            }
        }
    });

}

exports.fetchData = function (email, callback) {
    let query = "SELECT * FROM users WHERE email = ?";

    connection.query(query, email, async function (err, rows) {
        if (err) {
            console.log("Failed to fetch data: " + err);
            //TODO: check what we have to return in the callback if something failed
        } else {
            if (rows.length > 0) {
                let hashPass = rows[0].Password;
                callback(null, rows[0])
            }
        }

});
}