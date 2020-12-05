const mysql=require('mysql');
const express=require('express');
const session=require('express-session');
const bodyParser=require('body-parser');
const path=require('path');
//const router=express.Router();
 
//const { createConnection } = require('net');
//const { Server } = require('http');

const conn=mysql.createConnection({
    host:'localhost',
    user: 'root',
    password: 'sanjana123',
    database: 'Ecommercedb'
});

const app=express();
app.set('view engine','ejs');

app.use(express.static('public'));
app.use(session({
    secret:'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.post('/auth',(req,res)=>{
    var username=req.body.username;
    var password=req.body.password;
    if(username && password){
        conn.query('SELECT * FROM accounts WHERE username= ? AND password= ?', [username,password], (error,results,fields)=>{
         if(results.length>0 && username=="test"){
             req.session.loggedin = true;
             req.session.username=username;
             res.redirect('/home');
         }else if(results.length>0){
            req.session.loggedin = true;
            req.session.username=username;
            res.redirect('/home');
         }
         else{
             res.send("Incorrect");
         }
         res.end();
        });

    }else{
        res.send("Please enter username and pass");
        res.end();
    }
});
var Users=[];
app.get('/signmeup',(req,res)=>{
    res.sendFile(path.join(__dirname + 'public/signup.html'));
})


app.post('/signup',(req,res)=>{
    if(!req.body.username || !req.body.password){
        res.status("400");
        res.send("Invalid details!");
    }
    else{
    Users.filter(function(user){
        if(user.username===req.body.id){
            res.render('index',{message: 'User already exists!'});
        }
    });
    var sql='INSERT INTO accounts(username,password,email) values (?,?,?)'
    var newUser=[req.body.username, req.body.password,req.body.email];
    conn.query(sql,newUser, (error,results,fields)=>{
        if(error){
            return res.status(400);
            //res.send("Error");
            //console.log(error);
        }
        else{
            return res.redirect('/home'); 
            //res.status(200).json({
                //status: 'success'
            //});
            console.log("Success");
            res.send("Successfully signed up");
            res.redirect('/home');
        }
    });
    
    }
});

app.get('/home', function(request, response) {
	if (request.session.loggedin && request.session.username=="test") {
		response.redirect('/admin');
    }else if(request.session.loggedin){
        response.redirect('/buyer');
    } 
    else {
		response.send('Please login to view this page!');
	}
	response.end();
});

app.get('/buyer', (req,res)=>{
    res.sendFile(path.join(__dirname + '/public/buyer.html'));
});

app.get('/admin',(req,res)=>{
    res.sendFile(path.join(__dirname+ '/public/admin.html'));
});

app.post('/insert',(req,res)=>{
    var sql = 'INSERT INTO items (i_name, price, quantity) VALUES (?,?,?)';
    var newItem=[req.body.itemname,req.body.price,req.body.quantity];
    conn.query(sql, newItem, function (error,data) {
       if (error) throw error;
            console.log("Item inserted");
        });
    res.redirect('/admin');
});
app.post('/display',(req,res)=>{ 
    var sql='SELECT * FROM items';
    conn.query(sql,(error,data)=>{
        if(error) throw error;
        res.render('display', {title: 'Product list',productData:data});

    });   
});

app.get('/display',(req,res)=>{
    var sql='SELECT * FROM items';
    conn.query(sql,(error,data)=>{
        if(error) throw error;
        res.render('display',{title: 'Product list',productData:data});

    });
});

/*app.post('/update/:id',(req,res)=>{
   var sql='UPDATE items SET ? WHERE i_id='+req.params.id+';';
   var updateItem=[req.body.itemname,req.body.price,req.body.quantity];
   conn.query(sql,updateItem,(error,data)=>{
   if(error) throw error;
   res.render('/update',{title: 'Update list',itemData:data});
   });

});*/

app.post('/update/(:id)',(req,res)=>{
    if(req.params.id)
    {res.render('update');
    var sql='UPDATE items SET i_name=?, price=?, quantity=? WHERE i_no='+req.params.id+';';
    var updateItem=[req.body.itemname,req.body.price,req.body.quantity];
    conn.query(sql,updateItem,(error,data)=>{
    //if(error) throw error ;
    if(error)
        console.log(error);
    else{
        console.log("Updated successfully");}
    //    res.end();
    //res.end("<h1>Successfully updated<h1><script> setTimeout(function() { window.location.href = \"http://localhost:5000/display\";}, 500); </script>")
    //res.redirect('/display');
    }); }
});

app.get('/delete/:id', function(req, res, next) {
    var id= req.params.id;
      var sql = 'UPDATE items SET status="n" WHERE i_no = ?';
      conn.query(sql, [id], function (err, data) {
      if (err) throw err;
      console.log(data.affectedRows + " record(s) updated");
    });
    res.redirect('/display');
    
  });

app.listen(5000);
