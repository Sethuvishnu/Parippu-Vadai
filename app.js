require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const authRoutes=require('./routes/authRoutes')
const cookiePraser=require('cookie-parser');
const { requireAuth,checkUser } = require('./middleware/authMiddleware');
const User=require('./models/User');
const Email = require('./models/Email');

require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
// in app.js, near your other startup code
const { syncNewConversations } = require('./syncNewConversations');
const cron = require('node-cron');

cron.schedule('*/2 * * * *', () => {
  syncNewConversations().catch(err => console.error('[sync] error:', err.message));
});



const app = express();

// middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookiePraser());

// view engine
app.set('view engine', 'ejs');

// database connection
const dbURI = process.env.MONGODB;
mongoose.connect(dbURI)
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));





// routes
app.get('*',checkUser);
app.get('/', (req, res) => res.render('home'));
app.get('/smoothies',requireAuth, (req, res) => res.render('smoothies'));
app.get('/session', requireAuth, (req, res) => {
  console.log("Session route hit");
  res.render('session');
});



// , 'timestamp responses questionCount _id'
app.get('/emails', async (req, res) => {
  try {
    // fetch only the 'profile' field from all users
    let users = await Email.find({}); 
    console.log("Fetched Users:", users); // check what you got in console
    res.render("session", { users });  
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use(authRoutes)







//TO UNDERSTAND COOKIES-PARSER

// app.get('/set-cookies',(req,res)=>{

//   //res.setHeader('Set-Cookie','newUser=true');

//   res.cookie('newUser',false);
//   res.cookie('isemployee',true,{maxAge:1000*60*60*24,httpOnly:true});

//   res.send('you got the cookies')

// });

// app.get('/read-cookies',(req,res)=>{

//   const cookies=req.cookies;

//   console.log(cookies);

//   res.json(cookies);
 
// });