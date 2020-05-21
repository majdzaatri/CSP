const mysql =  require("mysql");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    port: 3306,
    password: "password",
    database: "csp"
});

//    sign-in queries      //

exports.checkLogin = function(email, password, callback)
{
    connection.query("SELECT * FROM users WHERE email = ? AND password = ?",[email, password], async function(err, rows, fields) {
       
        if(err){
            console.log("Failed to check if email and password exist in DB: " + err);
            //TODO: check if we have to return anything in the callback if something failed
        } else {
            if(rows.length > 0){
                console.log("login succeded..");
            }else{
                console.log("email doesn't exist or password wrong!");
            }
            callback(rows.length);
        }
    });
}


//    sign-up queries    //

exports.addNewAccount = function(newUser, callback)
{
    connection.query("SELECT COUNT(*) AS cnt FROM users WHERE email = ?", newUser.email, function(err, data){
        if (err){
            console.log("Failed checking if email is already exist: " + err);
        } else {
            if(data[0].cnt > 0){
                callback(0); //TODO: Check if it's OK
            } else {
                connection.query("INSERT INTO `csp`.`users` SET ?", newUser, function(err, res, fields){
                    if(err){
                        console.log("Failed to add new user: " + err);
                        callback(500); //TODO: Check if it's OK
                    } else {
                        callback(200);
                    }
                })
            }
        }
    })
}