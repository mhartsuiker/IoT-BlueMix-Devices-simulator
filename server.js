var express = require("express");
var app     = express();

app.use(express.static('public'));
app.use(express.static('script'));

app.get('/',function(req,res){
  res.sendFile('index.html');
  //It will find and locate index.html from View or Scripts
});

app.listen(8080);

console.log("Running at Port 8080");
