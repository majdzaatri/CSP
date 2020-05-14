const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({urlencoded: true}));
app.use('/public', express.static(__dirname+'/public'));

app.get('/', function(req,res){
    res.send("Hello World");
})

const port = "8080";
const host = "localhost";

const server = app.listen(port, host, () => {
    console.log('server running on http://' + host + ':' + port + '/');
});