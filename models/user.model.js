import {Schema, model} from "mongoose";
import bcrypt from 'bcryptjs'
// import bcrypt  from 'bcrypt'
import jwt from "jsonwebtoken";
import crypto from 'crypto'

const userSchema = new Schema({
    fullName:{
        type:String,
        required: [true, "name is required!"],
        minLength:[5,"full name must be atleast 5 characters"],
        maxLength:[50,"full name should be less than 50 characters"],
        trim:true
    },
    userName:{
        type:String,
        required:[true, "user name is required!"],
        lowercase:true,
        unique:true,
        trim:true
    },
    email:{
        type: String,
        required:[true, "email is required!"],
        unique:[true, "email already exist!"],
        lowercase:true,
        trim:true,
        match:[/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email']
    },
    password:{
        type:String,
        required:[true, "password is required!"],
        minLength:[8, "Password must be at least 8 character!"],
        select:false
    },
    avatar:{
        public_id :{
            type: String
        },
        secure_url :{
            type:String
        }
    },
    role:{
        type:String,
        enum:['USER','ADMIN'],
        default:'USER'
    },
    forgotPasswordTocken:{
        type:String
    },
    forgotPasswordExpiry:{
        type:Date
    }
},{timestamps:true})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
    return next()
})

userSchema.methods={
    generateJWTToken : async function(){
        return await jwt.sign(
            {id: this._id, email:this.email, subscription:this.subscription, role:this.role},
            process.env.JWT_SECRET,
            {
                expiresIn:process.env.JWT_EXPIRY
            }
        )
    },

    comparePassword : async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword, this.password)
    },

    generatePasswordResetToken : async function(){
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.forgotPasswordTocken = crypto.createHash('sha256').update(resetToken).digest('hex');
        this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15min from now

        return resetToken;
    }

}

const User = model('User',userSchema)

export default User