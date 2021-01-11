const mysql=require('mysql');
const express=require('express');
const session=require('express-session');
const bodyParser=require('body-parser');
const path=require('path');
const fileUpload = require('express-fileupload');
const twilio=require('twilio');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const flash=require('connect-flash');
var Strategy = require('passport-local').Strategy;
//const nexmo=require('nexmo');
//const router=express.Router();

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
    resave: false,
    saveUninitialized: false,
    cookie:{ //cookie
        httponly: true,
        maxAge:60*60*1000, //set to 1 hour
        secure:false
        }}));  
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(flash());
//passport middlewares
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });
app.get('/',(req,res)=>{
    var sql='SELECT * FROM items';
    conn.query(sql,(error,data)=>{
        if(error) throw error;
        res.render('home');
    }); 
});
app.get('/buyerpage',(req,res)=>{
  var sql='SELECT * FROM items';
  conn.query(sql,(error,data)=>{
      if(error) throw error;
      res.render('buyerpage', {title: 'Product list',productData:data});
  }); 
});
app.get('/register',(req,res)=>{
    res.render('register');
  });
  
  app.post('/register',(req,res)=>{
    const { name,email,password,password2} = req.body;
    let errors=[];
    if(!name || !email || !password || !password2){
       errors.push({msg: 'Input'});
    }
    if(password!==password2){
      errors.push({msg:'Not matching'});
    }
    if(password.length <5){ 
      errors.push({ msg: 'Password should have atleast 5 chars' });
    }
    if(errors.length >0){
      res.render('register',{errors,name,email,password,password2});
    }
     else {
      conn.query('SELECT email FROM user WHERE email ="' + email +'"', function (err, result) {
          if (err) throw err;
          console.log(result);    
          if(result.length == 0){ 
              bcrypt.genSalt(10, (err, salt) => { 
              bcrypt.hash(password,salt, function(err, hash) {
                  var sql = "INSERT INTO user (name,email,password) VALUES (?,?,?)";
                  var values = [name,email,hash]
                  conn.query(sql,values, function (err, result, fields) {
                  if (err) throw err;
                  req.flash('success_msg','You are now registered. Do login!');
                  res.redirect('/login');
                  });
               });
            });
          }
          else{
              req.flash('error','Email is already registered');
             // errors.push({ msg: 'Email is already registered' });
             res.render('register', {
              errors,
              name,
              email,
              password,
              password2 
            });               
          }
        });
          
       } 
      });
      app.get("/login",(req,res)=>{
        res.render('login');
      });
      
      app.get("/dashboard",require('connect-ensure-login').ensureLoggedIn(),
      function(req, res){
          conn.query("SELECT * from items",(error,data)=>{
            if(error) throw error;
            res.render('dashboard', {title: 'Product list',productData:data,user:req.user});
    
        });   
    });
    
      
      app.get('/logout',
        function(req, res){
          var sql='SELECT email from user WHERE loggedin="y";';
          conn.query(sql,(err,data)=>{
            var email=data[0].email;
            if(err) throw err;
            else{
              var sqlu='UPDATE user set loggedin="n" where email="'+email+'"';
              conn.query(sqlu,(err,data)=>{
                if(err) throw err;
              });

            };
          });
          req.logout();
          res.redirect('/login');
        });
      
      app.post('/login', 
        passport.authenticate('local-login', { 
          successRedirect: '/dashboard',
          failureRedirect: '/login',
          failureFlash: true }),
        function(req, res) {
          res.redirect('/');
        });
      //Authentication using passport
      passport.use(
        "local-login",
        new Strategy(
          {
            usernameField: "email",
            passwordField: "password",
            passReqToCallback: true
          },
          function(req, email, password, done) {
            console.log(email);
            console.log(password);
            conn.query('UPDATE user SET loggedin="y" where email=+"'+email+'"',(err,data)=>{
              if(err) throw err;
              console.log(data);
            });
            conn.query('SELECT * FROM user WHERE email ="' + email +'"',function(err, rows) {
              console.log(rows);  
              if (err) return done(err);
                if (!rows.length) {
                  return done(
                    null,
                    false,
                    {message: "Email id not registered"});
                }
                console.log(rows[0].password);
                bcrypt.compare(password,rows[0].password,function(err,result){
                  if(result){
                    return done(null, rows[0]);
                  }
                  else{
                    return done(
                      null,
                      false,
                      { message: 'Incorrect email or password' });
                  }
                });
                  
              });
          }
      )
      );
      //Serialize the user
      passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
      
      // Deserialize the user
      passport.deserializeUser(function(id, done) {
        conn.query("select * from user where id = " + id, function(
          err,
          rows
        ) {
          done(err, rows[0]);
        });
      });
      
  
/*
app.post('/auth',(req,res)=>{
    var username=req.body.username;
    var password=req.body.password;
    if(username && password){
        conn.query('SELECT * FROM accounts WHERE username= ? AND password= ?',[username,password], (error,results,fields)=>{
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
    res.sendFile(path.join(__dirname + '/public/signup.html'));
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
        }
        else{
            return res.redirect('/home'); 
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
    var sql='SELECT * FROM items';
    conn.query(sql,(error,data)=>{
        if(error) throw error;
        res.render('admin', {title: 'Product list',productData:data});

    });   
    //res.sendFile(path.join(__dirname+ '/public/admin.html'));
});
*/
app.get('/insert',(req,res)=>{
    message = ''
    res.render('additem',{message:message});
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
      var name= post.itemname;
      var price= post.price;
      var quantity= post.quantity;
 
	  if (!req.files){
            console.log("Error");
            }
		var file = req.files.uploaded_image;
		var img_name=file.name;
 
	  	 if(file.mimetype == "image/jpeg" || file.mimetype=="image/jpg" || file.mimetype == "image/png"||file.mimetype == "image/gif" || file.mimetype=="image/webp"){
                                 
              file.mv('public/images/'+file.name, function(err) {
               if (err)
	                return res.status(500).send(err);
      			var sql = "INSERT INTO items(i_name,price,quantity,image) VALUES (?,?,?,?)";
                var newItem=[name,price,quantity,img_name];
    			conn.query(sql, newItem,function(err, result) {
    				 res.redirect('/display');
    				});
				});
          } else {
            message = "This format is not allowed , please upload file with '.png','.gif','.jpg'";
            res.render('additem.ejs',{message: message});
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

app.get('/update/:id',(req,res)=>{
   //var sql='SELECT * FROM items WHERE i_no='+req.params.id+';'
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

app.get('/addoffer/:id',(req,res)=>{
    var sql='UPDATE items SET offer="y" WHERE i_no='+req.params.id+';';
   conn.query(sql,(error,data)=>{
       if(error) throw error;
   });
   res.render('addoffer');
});

app.post('/addoffer/addoffer',(req,res)=>{
    var sql='UPDATE items SET price=? WHERE i_no='+req.body.id+';'
    var updateItem=[req.body.price];
    conn.query(sql,updateItem,(error,data)=>{
    if(error) throw error ;
    console.log("Offer applied");
    res.redirect('/display');
})
});

app.get('/offers',(req,res)=>{
    var sql='SELECT * from items';
    conn.query(sql,(err,data)=>{
        if(err) throw err;
        res.render('offers',{title: 'Offers page', productData:data});
    });
});
/*
app.get('/alertcustomer',(req,res)=>{
    res.render('alertcustomer');
});*/

app.post('/alertcustomer',(req,res)=>{
    const accountSid = 'ACb6f4119fb55de4857897018d076c2c58';
    const authToken = '62f07a0532bf3549cf03a38d3f26f472';
    const client = twilio(accountSid, authToken);
    client.messages
      .create({
         body: "25% offer!",
         from: '+12513049459',
         to: '+918921791774'
       }).then(message => console.log(message.sid));
       res.redirect('/display');
});

app.get('/delete/:id', (req, res, next)=> {
    var id= req.params.id;
      var sql = 'UPDATE items SET status="n" WHERE i_no = ?';
      conn.query(sql, [id], function (err, data) {
      if (err) throw err;
      console.log(data.affectedRows + " record(s) updated");
    });    res.redirect('/display');
    
  });

  app.post("/addtocart/:id/:name/:price",(req,res)=>{
    var id=req.params.id;
    var name=req.params.name;
    var price=req.params.price;
    var quantity=req.body.qty;
    let errors=[];
    console.log(quantity);
    var sqlq='SELECT quantity FROM items where i_no='+id;
    conn.query(sqlq,(err,data)=>{
      console.log(data[0].quantity);
      if(err) throw err;
      if(quantity>data[0].quantity){
        console.log("Out of stock");
       // errors.push({msg:'Out of stock'});
      console.log(data);
      res.redirect('/outofstock');  
      }
   else{
    var newquantity=data[0].quantity-quantity;
    console.log(newquantity);
    var sql='INSERT into cart(i_name,price,quantity) VALUES (?,?,?);'
    var insertitem=[name,price,quantity];

    conn.query(sql,insertitem,(err,data)=>{
      console.log(data);
      if(err) throw err;
      res.redirect("/cart");
    
    });
   var sqlu='UPDATE items SET quantity=? where i_no='+id;
   var updateItem=[newquantity];
   conn.query(sqlu,updateItem,(err,data)=>{
     if(err) throw err;
   });
  } 
     
  });  });
  app.get('/outofstock',(req,res)=>{
    res.render("outofstock");
  })

  app.get("/cart",(req,res)=>{
    var sql="SELECT * FROM cart";
    conn.query(sql,(err,data)=>{
      if(err) throw err;
     // console.log(data);
      res.render('cart',{productData:data});
    })
  });

  app.post("/bill",(req,res)=>{
   var sql='SELECT price from cart;';
   conn.query(sql,(err,data)=>{
     if(err) throw err;
     res.render('bill',{productData:data});
   })
  });

  app.get('/userinfo',(req,res)=>{
    var sql='SELECT * from user';
    conn.query(sql,(err,data)=>{
      if(err) throw err;
      res.render('userinfo',{userData:data});
    })
  });

  app.get('/edituserinfo',(req,res)=>{
    res.render('edituserinfo');
  });

  app.post('/edituserinfo',(req,res)=>{
     var name=req.body.name;
     var email=req.body.email;
     var phone=req.body.phone;
     var address=req.body.address;
     var sql='UPDATE user set name=?,phone=?,address=? where email="'+email+'"';
     var editUser=[name,phone,address];
     conn.query(sql,editUser,(err,data)=>{
       if(err) throw err;
       res.redirect('/userinfo');
     })
  });

app.get('/users',(req,res)=>{
  var sql='select * from user';
  conn.query(sql,(err,data)=>{
    if(err) throw err;
    res.render('users',{userData:data});
  })
});

app.listen(5000);
