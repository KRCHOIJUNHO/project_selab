var express = require('express');
var app = express();
var path = require ('path');

app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(__dirname + '/public'));

var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    post: 3000,
    password: '',
    database: 'selab'
});

//db 확인
connection.connect(function (err){
    if(err){
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('Success DB connection');
});

var server = require('http').createServer(app);

app.listen(3000, function (){
    console.log('Example app listening on port 3000!');
});

// get html(rendering)
app.get('/', function (req, res){
    res.render('index.ejs');
});

app.get('/login', function (req, res){
    res.render('login.ejs', {alert: false});
});

app.get('/register', function(req, res){
   res.render('register.ejs'); 
});

app.get('/members', function(req, res){
   res.render('members.ejs'); 
});

app.get('/research', function(req, res){
   res.render('research.ejs'); 
});

app.get('/notice', function (req, res){
    res.render('notice.ejs');
});

// post html
app.post('/', function(req, res){
    var id = req.body.id;
    var pwd = req.body.pwd;
    
    var sql = 'SELECT * FROM user_info WHERE username = ?';
    connection.query(sql, [id], function(error, results, fields){
        if(results.length == 0){
            res.render('login.ejs', {alert: true});
        } else{
            var db_pwd = results[0].password;

            if(pwd == db_pwd){
                res.redirect("/");
            } else{
                res.render('login.ejs', {alert: true});
            }
        }
    })
})

app.post('/register', function(req, res){
    var id = req.body.id;
    var pwd = req.body.pwd;
    var pwdconf = req.body.pwdconf;
    console.log(id, pwd);
    var sql = 'SELECT * FROM user_info WHERE username = ?';
    connection.query(sql, [id,pwd], function(error, data, fileds){
        if(data.length == 0){
            connection.query("INSERT INTO user_info VALUES(?,?)",[id,pwd],function(){
                console.log(data);
                res.redirect('/');
            })
        }
        else{
            console.log("존재");
            res.render("register.ejs",{alert: true});
        }
    });
});
