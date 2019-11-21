var express = require('express');
var app = express();
var path = require ('path');
var XLSX = require('xlsx');
var server = require('http').createServer(app);
var mysql = require('mysql');
var bodyParser = require('body-parser');
var session = require('express-session');
var fs = require('fs');

app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));

//localhost:3000
app.listen(3000, function (){
    console.log('Example app listening on port 3000!');
});

//session
app.use(session({
    secret: 'sid',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60
    }
}));

//connect Database
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    post: 3000,
    password: '',
    database: 'selab'
});

connection.connect(function (err){
    if(err){
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('Success DB connection');
});

//Excel file
fs.exists(__dirname + '/public/resources/score.xlsx', function (exists) {
    if (exists) {
        console.log("exists");
        var score_data = XLSX.readFile(__dirname + '/public/resources/score.xlsx');
        var sheet_name_list = score_data.SheetNames;
        var scores = XLSX.utils.sheet_to_json(score_data.Sheets[sheet_name_list[0]]);

        for (var i = 0; i < scores.length; i++) {
            var studentid = scores[i]["studentid"];
            var score = scores[i]["score"];
            var rank = scores[i]["rank"];

            connection.query("INSERT INTO score VALUES(?,?,?)", [studentid, score, rank]);
        }

    }
    else {
        console.log("no exists");
    }
});

// get html(rendering)
app.get('/', function (req, res){
    if (req.session.user) {
        res.render('index.ejs', {
            logined : req.session.user.logined,
            user_name : req.session.user.user_name
        });
    }
    else {
        res.render('index.ejs', {
            logined : false,
            user_name : " "
        });
    }
});

app.get('/login', function (req, res){
    res.render('login.ejs', {data:true});
});

app.get('/register', function(req, res){
    res.render('register.ejs', {alert: false});
});

app.get('/members', function(req, res){
    if (req.session.user) {
        res.render('members.ejs', {
            logined : req.session.user.logined,
            user_name : req.session.user.user_name
        });
    }
    else {
        res.render('members.ejs', {
            logined : false,
            user_name : " "
        });
    }
});

app.get('/research', function(req, res){
    if (req.session.user) {
        res.render('research.ejs', {
            logined : req.session.user.logined,
            user_name : req.session.user.user_name
        });
    }
    else {
        res.render('research.ejs', {
            logined : false,
            user_name : " "
        });
    }
});

app.get('/notice', function (req, res){
    var sql = 'SELECT * FROM notice';
    connection.query(sql, function(error, results, fields){
        if (req.session.user) {
            res.render('notice.ejs', {
                logined : req.session.user.logined,
                user_name : req.session.user.user_name,
                results 
            });
        }
        else {
            res.render('notice.ejs', {
                logined : false,
                user_name : " ",
                results
            });
        }
    });
});

app.get('/notice_insert', function (req, res){
    if (req.session.user) {
        res.render('notice_insert.ejs', {
            logined : req.session.user.logined,
            user_name : req.session.user.user_name
        });
    }
    else {
        res.redirect('/login');
    }
});

app.get('/notice/:notice_id', function (req, res) {
    var notice_id = req.url.split("/")[2];
    var sql = 'SELECT * FROM notice WHERE notice_id = ?';

    connection.query('UPDATE notice SET view = view + 1 WHERE notice_id = ?', [notice_id]);
    connection.query(sql, [notice_id], function(error, results, fields){
        console.log(results);
        if (req.session.user) {
            res.render('notice_id.ejs', {
                logined: req.session.user.logined,
                user_name: req.session.user.user_name,
                results
            });
        } 
        else {
            res.render('notice_id.ejs', {
                logined: false,
                user_name: " ",
                results
            })
        }
    })
});

app.get('/score', function(req, res){
    if(req.session.user){
        res.render('score.ejs', {
            alert : false,
            rank : null,
            score : null
        });
    }
    else{
        res.redirect('/login');
    }
});

// post html
app.post('/notice_insert', function(req, res){
    var title = req.body.title;
    var content = req.body.content;
    var writer_name = req.session.user.user_name;
    
    var sql = 'INSERT INTO notice(title, content, writer_name) VALUES (?,?,?)';
    connection.query(sql, [title, content, writer_name], function(error, results, fields){
        res.redirect('/notice');
    });
});

app.post('/', function(req, res){
    var user_id = req.body.user_id;
    var user_password = req.body.user_password;
    
    var sql = 'SELECT * FROM user_info WHERE user_id = ?';
    connection.query(sql, [user_id], function(error, results, fields){
        if(results.length == 0){
            res.render('login.ejs', {alert: true});
        } else{
            var db_pwd = results[0].user_password;

            if(user_password == db_pwd){
                //session
                req.session.user = {
                    logined : true,
                    user_name : results[0].user_name
                }
                res.render('index.ejs', {
                    logined : req.session.user.logined, 
                    user_name : req.session.user.user_name
                });
            } 
            else{
                res.render('login.ejs', {alert: true});
            }
        }
    });
})

app.post('/register', function(req, res){
    var user_name = req.body.user_name;
    var studentid = req.body.studentid;
    var user_id = req.body.user_id;
    var user_password = req.body.user_password;
    var pwdconf = req.body.pwdconf;
    
    if(user_password !== pwdconf){
        res.redirect('/register');
    }
    else {
        var sql = 'SELECT * FROM user_info WHERE user_name = ?';
        connection.query(sql, [user_name], function(error, results, fields){
            if(results.length == 0){
                connection.query("INSERT INTO user_info VALUES(?,?,?,?)", [user_name,studentid,user_id,user_password], function(){
                    res.redirect('/login');
                }); 
            }
            else{ 
                res.render("register.ejs", {alert: true});
            }
        }); 
    }
});

app.post('/score', function(req, res){
    var studentid = req.body.studentid;
    var sql = 'SELECT * FROM score WHERE studentid = ?';
    connection.query(sql, [studentid], function(error, results, fields){
            if(results.length > 0){
                console.log(results);
                score = results[0].score;
                rank = results[0].rank;
                res.render('score.ejs', {
                    alert : true,
                    score,
                    rank
                });
            }
            else{
                res.render('score.ejs', {
                    alert : false,
                    score,
                    rank
                });
            }
        
    });
});