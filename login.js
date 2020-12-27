const mysql=require('mysql');
const express=require('express');
const session=require('express-session');
const bodyParser=require('body-parser');
const path=require('path');
const fileUpload = require('express-fileupload');

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
app.use(fileUpload());

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

app.get('/home', (request, response)=>{
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

app.get('/insert',(req,res)=>{
    message = ''
    res.render('insert',{message:message});
});

app.post('/insert',(req,res)=>{
  /*  var sql = 'INSERT INTO items (i_name, price, quantity) VALUES (?,?,?)';
    var newItem=[req.body.itemname,req.body.price,req.body.quantity];
    conn.query(sql, newItem, function (error,data) {
       if (error) throw error;
            console.log("Item inserted");
        });
    res.redirect('/admin'); */
    message = '';
   
      var post  = req.body;
      var name= post.user_name;
      var pass= post.password;
      var fname= post.first_name;
      var lname= post.last_name;
      var mob= post.mob_no;
 
	  if (!req.files){
            console.log("Error");
            }
		var file = req.files.uploaded_image;
		var img_name=file.name;
 
	  	 if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" || file.mimetype=="image/webp"){
                                 
              file.mv('public/images/upload_images/'+file.name, function(err) {
                             
	              if (err)
 
	                return res.status(500).send(err);
      					var sql = "INSERT INTO users_image(first_name,last_name,mob_no,user_name, password ,image) VALUES ('" + fname + "','" + lname + "','" + mob + "','" + name + "','" + pass + "','" + img_name + "')";
 
    						var query = conn.query(sql, function(err, result) {
    							 res.redirect('/display');
    						});
					   });
          } else {
            message = "This format is not allowed , please upload file with '.png','.gif','.jpg'";
            res.render('insert.ejs',{message: message});
          }
    
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
/*
app.post('/updated',(req,res)=>{
   var sql='UPDATE items SET ? WHERE i_no='+req.body.id+';';
   var updateItem=[req.body.itemname,req.body.price,req.body.quantity];
   conn.query(sql,updateItem,(error,data)=>{
   if(error) throw error;
   res.redirect('/display');
});

});*/

app.get('/update/:id',(req,res)=>{
   // var sql='SELECT * FROM items WHERE i_no='+req.params.id+';'
   res.render('update');
});
app.post('/update/updated',(req,res)=>{
   var sql='UPDATE items SET i_name=?, price=?, quantity=?, status="y" WHERE i_no='+req.body.id+';'
    var updateItem=[req.body.itemname,req.body.price,req.body.quantity];
    conn.query(sql,updateItem,(error,data)=>{
    if(error) throw error ;
    console.log("Updated");
    /*else{
        console.log("Updated successfully");}
    //    res.end();
    //res.end("<h1>Successfully updated<h1><script> setTimeout(function() { window.location.href = \"http://localhost:5000/display\";}, 500); </script>")
    //res.redirect('/display');*/
    res.redirect('/display');
   });
});

app.get('/delete/:id', (req, res, next)=> {
    var id= req.params.id;
      var sql = 'UPDATE items SET status="n" WHERE i_no = ?';
      conn.query(sql, [id], function (err, data) {
      if (err) throw err;
      console.log(data.affectedRows + " record(s) updated");
    });    res.redirect('/display');
    
  });



app.listen(5000);
