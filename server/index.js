const express = require('express')
const app = express()
const mysql = require('mysql')
const cors = require('cors');
const bcrypt = require('bcrypt')

const saltRounds = 10;

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const e = require('express');
const { response } = require('express');

app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT"],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    key: "userId",
    secret: "testsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 60 * 60 * 24 * 1000, 
        httpOnly: false,
        secure: false
    }
}))

const db = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    port: 3306,
    password: '123456789',
    database: 'qless_system'
});

app.post('/register', (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    const expiryDate = req.body.expiryDate;
    const cardLoad = req.body.cardLoad;
    const lastTravel = req.body.lastTravel;
    const discountCardNumber = req.body.discountCardNumber;
    const isDiscounted = req.body.isDiscounted;

    bcrypt.hash(password, saltRounds, (err, hash) => {
    
    if(err){
        console.log(err)
    }
    db.query('INSERT INTO users (username, password, expiryDate, lastTravel, cardLoad, discounted, discountCardNumber) VALUES(?, ?, ?, ?, ?, ?, ?)', 
    [username, hash, expiryDate, lastTravel, cardLoad, isDiscounted, discountCardNumber], (err, result) => {
        if(err) {
            if(err.errno == 1062){
            res.send({message: "User already exists"});
        }
            else{
                res.send({message: err.message})
            }
        }
        else{
            res.send("Successful Registration")
        }
    });
    })

    
});

// const verifyJWT = (req, res, next) => {
//     const token = req.headers["x-access-token"]

//     if(!token){
//         res.send("Token not found")
//     }else{
//         jwt.verify(token, "jwtSecret", (err, decoded) => {
//             if(err){
//                 res.json({auth: false, message: "Authentication failed"})
//             }
//             else{
//                 req.userId = decoded.id;
//                 next();
//             }
//         })
//     }
// }

// app.get("/userAuthCheck", verifyJWT , (req, res) => {
//     res.send("You are authenticated")
// })


app.get("/login", (req, res) => {
    if(req.session.user) {
        res.send({loggedIn: true, user: req.session.user})
    } else{
        res.send({loggedIn: false})
    }
})


app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.query("SELECT * FROM users WHERE username = ?",
        username,
        (err, result) => {
            if(err){
                res.send({err: err});
            }
                if(result.length > 0){
                    bcrypt.compare(password, result[0].password, (error, response) => {
                        if(response){
                        console.log(result)
                        req.session.user = result
                        console.log(req.session.user)
                        res.json(result);
                        }
                        else{
                            res.send({message: "Wrong username/password combination!"});
                            console.log("Wrong");
                        }
                    })
                } else {
                   res.send({message: "User doesn't exist"});
                }
        }
    )
});

app.put('/update', (req, res)=>{
    const cardLoad = req.body.cardLoad;
    const lastTravel = req.body.lastTravel;
    const expiryDate = req.body.expiryDate;
    const username = req.body.username;
    const dailyTravels = req.body.dailyTravels;
    req.session.user[0].cardLoad = req.body.cardLoad;
    req.session.user[0].lastTravel = req.body.lastTravel;
    req.session.user[0].expiryDate = req.body.expiryDate;
    req.session.save();
    db.query("UPDATE users SET cardLoad = ?, lastTravel = ?, expiryDate = ?, dailyTravels = ? WHERE username = ?", 
    [cardLoad, lastTravel, expiryDate, dailyTravels, username], 
    (err, result) => { 
    if(err){
        console.log(err);
    }else{
        res.send(result);
    }
    }   
    );
    
});

app.put('/reloadCard', (req, res)=>{
    const cardLoad = req.body.cardLoad;
    const username = req.body.username;
    req.session.user[0].cardLoad = req.body.cardLoad;
    req.session.save();
    db.query("UPDATE users SET cardLoad = ? WHERE username = ?", 
    [cardLoad, username], 
    (err, result) => { 
    if(err){
        console.log(err);
    }else{
        res.send(result);
    }
    }   
    );
});

app.listen(3001, ()=> {
    console.log("Your server is running on port 3001");
});