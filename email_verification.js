require('dotenv').config();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const EMAIL_SECRET = process.env.EMAIL_SECRET;
const ID_SECRET = process.env.ID_SECRET;
const EMAIL = process.env.EMAIL;
const EMAIL_PASS = process.env.EMAIL_PASS;

    var transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: EMAIL,
        pass: EMAIL_PASS
      }
    });  


exports.sendConfirmation = function(newEmail){
  // async email
    jwt.sign(
    {
      confirmedEmail: newEmail,
    },
    EMAIL_SECRET,
    {
      expiresIn: '1d',
    },
    (err, emailToken) => {
      const url = `http://cspproject.herokuapp.com/confirmation/${emailToken}`;
      var mailOptions = {
            from: EMAIL,
            to: newEmail,
            subject: 'Confirmation',
            html: "<h1>CSP</h1><br><h3>Thank you for choosing us</h3><br><h5>please confirm your email by clicking on the link:</h5>" + url
          };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) { 
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
              console.log("sending!!!!!")
            }
          });
    },
  );
}


exports.sendPurchaseDetails = function(user, callback) {

  var mailOptions = {
    from: EMAIL,
    to: user.Email,
    subject: 'Order Confirmation',
    html: "<h1> Hello " + user.FirstName +",</h1> <h3>Thank you for shopping with us, We'll send a confirmation when your item delivers.</h3>"
  }

  transporter.sendMail(mailOptions, function(err, info){
    if(err){
      console.log("error occurred, sending purchase details mail: " + err);
      callback(500);
    } else {
      console.log("Email sent: " + info.response);
      callback(200);
    }
  });

}


exports.dataUpdateConfirmation = function(userEmail){
  console.log(userEmail)

  var mailOptions = {
    from: EMAIL,
    to: userEmail,
    subject: 'Confirmation',
    html: "<h1>CSP</h1><br><h3>Thank you for choosing us</h3><br><h5> Your data has been updated successfuly"
  };

  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
       console.log('Email sent: ' + info.response);
    }
  });
}

exports.PasswordUpdateConfirmation = function(userEmail){
  console.log(userEmail)
  
  var mailOptions = {
    from: EMAIL,
    to: userEmail,
    subject: 'Confirmation',
    html: "<h1>CSP</h1><br><h3>Thank you for choosing us</h3><br><h5> Your password has been updated successfuly"
  };

  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
       console.log('Email sent: ' + info.response);
    }
  });
}


exports.emailUpdateActivation = function(newEmail,ID){
  // asyncr email
  jwt.sign(
    {
      newEmail: newEmail,
      ID : ID, 
    },
    EMAIL_SECRET,
    {
      expiresIn: '1d',
    },
    (err, emailToken) => {
      const url = `http://cspproject.herokuapp.com/email-confirmation/${emailToken}`;
        var mailOptions = {
            from: EMAIL,
            to: newEmail,
            subject: 'Confirmation',
            html: "<h1>CSP</h1><br><h3>Thank you for choosing us</h3><br><h5>please confirm your email by clicking on the link:</h5>" + url
          };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log(url);
               console.log('Email sent: ' + info.response);
            }
          });
    },
  );

}

exports.forgetPassword = function(email,callback){

    // async email
    jwt.sign(
      {
        userEmail: email,
      },
      EMAIL_SECRET,
      {
        expiresIn: '1d',
      },
      (err, emailToken) => {
        const url = `http://cspproject.herokuapp.com/reset-password/${emailToken}`;
        var mailOptions = {
              from: EMAIL,
              to: email,
              subject: 'Forget Password',
              html: "<h1>CSP</h1><br><h3>Thank you for choosing us</h3><br><h5>please confirm your email by clicking on the link:</h5>" + url
            };
          transporter.sendMail(mailOptions, function(error, info){
              if (error) { 
                console.log(error);
                callback(0)
              } else {
                 console.log('Email sent: ' + info.response);
                 callback(1)
              }
            });
      },
    );


}