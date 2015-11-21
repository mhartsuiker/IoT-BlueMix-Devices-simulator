var express = require("express");
var favicon = require('serve-favicon');
var app     = express();

// Configuration
app.configure(function() {
    app.set('port', process.env.PORT || 8080); 
    app.use(favicon(__dirname + '/public/favicon.ico'));    
    app.use(express.static(__dirname + '/public'));
    app.use(express.static(__dirname + '/public/scripts'));   
});

//It will find and locate index.html from View or Scripts
app.get('/',function(req,res){
  res.sendFile('index.html');
});

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
})
