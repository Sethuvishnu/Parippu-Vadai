const mongoose = require('mongoose');
const {isEmail}=require('validator');//npm i validator
const bcrypt=require('bcrypt');


const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:[true,"please enter an email"],
        unique:true,
        lowercase:true,
        validate:[isEmail,"Pleasenter a valid email"]
    },
    password:{
        type:String,
        required:[true,"please enter an password"],
        minLength:[6,"minimum length is 6"]

    },
});


//mongoose hook help to happen after certain mongoose event happens


//fire a funtion after a new user join the database
//MIDDLEWARE (AFTER USER CREATED)

// userSchema.post('save',function(doc,next){
//     console.log('new user was created and saved',doc);
//     //without next the username and pass won't get saved in db but you can see in the console
//     next();
// })


// fire a funtion before doc saved to db(BEFORE USER GETTING CREATED)
userSchema.pre('save',async function(next){
    console.log('user about to be created & saved',this);

    const salt= await bcrypt.genSalt();
    // pass is saved as a object
    this.password=await bcrypt.hash(this.password,salt);
    next();
});


//static method to login user
userSchema.statics.login= async function(email,password) {
    const user =await this.findOne({email});
    if(user){

       const auth =await bcrypt.compare(password,user.password);

       if (auth){
        return user
       }
       throw Error('incorret pasword')
    }
    throw Error('incorrect email')

    
}

const User=mongoose.model('users',userSchema);

module.exports=User;