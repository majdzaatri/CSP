require("dotenv").config();
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
            html: "<h1>CSP</h1><h3>Thank you for choosing us</h3><h4>Please confirm your email by clicking on the link below:</h4>" + url
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

var today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
const yyyy = today.getFullYear();

today = dd + '/' + mm + '/' + yyyy;

exports.sendPurchaseDetails = function(user, purchaseData, callback) {

console.log("purchase data : " + JSON.stringify(purchaseData));

  var mailOptions = {
    from: EMAIL,
    to: user.Email,
    subject: "Order Confirmation",
    html: "<h1> Hello " + user.FirstName +",</h1> " +
    "<h3>Thank you for shopping with us, this is your receipt from CSP.</h3>" +
    "<div style='line-height: 0.4;'>" +
    "<h3>Order Number</h3>" +
    "<h3>#" + Math.floor(Math.random()*1000000) + "</h3>" +
    "</div><br />" +
    "<div style='line-height: 0.4;'>" +
    "<h3>Date Ordered</h3>" +
    "<h3>" + today + "</h3>" +
    "</div><br />" +
    "<div style='background-color: grey;'>" +
    "<table style='width:100%; border: 1rem double #242321;'>" +
    "<tr>" +
      "<th>Item</th>" +
      "<th>Model</th>" +
      "<th>Price in USD</th>" +
      "<th>Price in ILS</th>" +
    "</tr>" +
    "<hr>" +
    "<tr>" +
      "<th style='padding: 20px 0;'>" + purchaseData[0] + "</th>" +
      "<th>" + purchaseData[1] + "</th>" +
      "<th>" + purchaseData[3] + "</th>" +
      "<th>" + purchaseData[4] + "</th>" +
    "</tr>" +
    "</div>"
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
    html: "<h1>CSP</h1><br><h5> Your data has been updated successfuly</h5>"
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
    html: "<h1>CSP</h1><br><h5> Your password has been updated successfuly </h5>"
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
            html: "<h1>CSP</h1><br><h5>Please confirm your email by clicking on the link below:</h5>" + url
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
              html: "<h1>CSP</h1><br><h5>Please confirm your email by clicking on the link below:</h5>" + url
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