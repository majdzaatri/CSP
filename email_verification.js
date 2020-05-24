const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const EMAIL_SECRET = 'asdf1093KMnzxcvnkljvasdu09123nlasdasdf';


    var transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: 'csportbraude@hotmail.com',
        pass: 'Aa100100'
      }
    });  


exports.sendConfirmation = function(user){
  // async email
    jwt.sign(
    {
      user: user,
    },
    EMAIL_SECRET,
    {
      expiresIn: '1d',
    },
    (err, emailToken) => {
      const url = `http://cspproject.herokuapp.com/confirmation/${emailToken}`;


        var mailOptions = {
            from: 'csportbraude@hotmail.com',
            to: user,
            subject: 'Confirmation',
            html: "<h1>CSP</h1><h3>Thank you for choosing us</h3><h5>please confirm your email by clicking on the link:</h5>" + url
          };


        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
               console.log('Email sent: ' + info.response);
            }
          });
    },
  );
}