var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
var hostName = '127.0.0.1'
var port = 6699;
const path = require('path')
app.use(express.static(path.join(__dirname, 'public')))
//创建服务
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
app.listen(port, hostName, function () {
    console.log(`服务器运行在http://${hostName}:${port}`);
})


// app.get('/',function(req,res){
//     res.sendFile(`${__dirname }/index.html`)
// })