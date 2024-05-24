import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import emailValidator from 'email-validator'
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import { error } from "console";
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto'

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
    httpOnly: true,
    secure: true
}

const register = async (req, res, next) => {
    try {
        const { fullName, userName, email, password } = req.body;

        if (!fullName || !userName || !email || !password) {
            return next(new AppError("All feilds are required!", 400))
        }

        const validEmail = emailValidator.validate(email)
        if (!validEmail) {
            return next(new AppError('Please enter valid email!', 400))
        }

        const userExist = await User.findOne({ email });
        if (userExist) {
            return next(new AppError("User already exist!", 400))
        }

        const user = await User.create({
            fullName,
            userName,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url: ''
            }
        })

        if (!user) {
            return next(new AppError('User registeration failed, Please try again!', 400))
        }

        // File Upload
        // console.log("File Details"+JSON.stringify(req.file));
        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    width: 250,
                    height: 250,
                    gravity: "faces",
                    crop: 'fill'
                })

                if (result) {
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;

                    // Remove file from server
                    fs.rm(`uploads/${req.file.filename}`)

                }
            } catch (error) {
                return next(new AppError(error || 'File not uploaded, please try again!', 500))
            }
        }




        await user.save()

        user.password = undefined;

        const token = await user.generateJWTToken();

        res.cookie('token', token, cookieOptions)

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user
        })
    } catch (error) {
        return next(new AppError(error.message, 400))
    }
}


const login = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return next(new AppError("All feilds are required", 400))
        }

        const user = await User.findOne({
            email
        }).select('+password')

        if (!user || !user.comparePassword(password)) {
            return next(new AppError("Email or password does not match", 400))
        }

        const token = await user.generateJWTToken()
        user.password = undefined

        res.cookie('token', token, cookieOptions)

        res.status(200).json({
            success: true,
            message: 'User loggedin successfully',
            user
        })
    } catch (error) {
        return next(new AppError(error.message, 400))
    }
}


const logout = (req, res, next) => {
    try {
        res.cookie('token', null, {
            secure: true,
            maxAge: 0,
            httpOnly: true
        })

        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        })
    } catch (error) {
        return next(new AppError(error.message, 400))
    }
}
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id

        const user = await User.findById(userId)

        res.status(200).json({
            success: true,
            message: "User details",
            user
        })
    } catch (error) {
        return next(new AppError("Failed to feth user detail", 500))
    }

}

const forgotPassword = async (req, res, next) => {

    const { email } = req.body

    if (!email) {
        return next(new AppError("Email is required!", 400))
    }

    const user = await User.findOne({ email })

    if (!user) {
        return next(new AppError("Email is not registered", 400))
    }

    const resetToken = await user.generatePasswordResetToken();

    await user.save();

    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    console.log(resetPasswordURL);
    const message =
        `
                    <p>Click the following link to reset your password:</p>
                    <a href=${resetPasswordURL} target="_blank">Reset Password</a>
                    <p>This link is valid for 15 min. If you did not request a password reset, please ignore this email.</p>
                    <p>Sincerely,</p>
                    <p>LMS Team</p>`;
    const subject = "Reset password";
    try {
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Reset password tocken has been sent to ${email} successfully`
        })
    } catch (error) {
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordTocken = undefined;
        await user.save();
        return next(new AppError(error.message, 400))
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const { resetToken } = req.params;

        const { password } = req.body

        const forgotPasswordTocken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const user = await User.findOne({
            forgotPasswordTocken,
            forgotPasswordExpiry: { $gt: Date.now() }
        })

        if (!user) {
            return next(new AppError('Tocken is invalid or expired, please try again', 400))
        }

        user.password = password;
        user.forgotPasswordTocken = undefined;
        user.forgotPasswordExpiry = undefined;

        user.save();
        res.status(200).json({
            success: true,
            message: `Your password change successfully`
        })
    } catch (error) {
        return next(new AppError(error.message, 400))
    }


}

const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const { id } = req.user;

        if (!oldPassword || !newPassword) {
            return next(new AppError('All feilds required!', 400))
        }

        const user = await User.findById(id).select('+password');

        if (!user) {
            return next(new AppError('User does not exist!', 400))
        }

        const isPasswordValid = await user.comparePassword(oldPassword);

        if (!isPasswordValid) {
            return next(new AppError('Invalid old password', 400))
        }

        user.password = newPassword;

        await user.save();

        user.password = undefined;

        user.status(200).json({
            success: true,
            message: "Password change successfully"
        })
    } catch (error) {
        return next(new AppError(error.message, 400))
    }
}

const updateUser = async (req, res, next) => {
    try {
        const { fullName } = req.body
        const { id } = req.user.id

        const user = await User.findById(id);

        if (!user) {
            return next(new AppError("User does not exist!", 400))
        }

        if (req.fullName) {
            user.fullName = fullName
        }

        if (req.file) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id)
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    width: 250,
                    height: 250,
                    gravity: "faces",
                    crop: 'fill'
                })

                if (result) {
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;

                    // Remove file from server
                    fs.rm(`uploads/${req.file.filename}`)

                }
            } catch (error) {
                return next(new AppError(error || 'File not uploaded, please try again!', 500))
            }
        }

        await user.save()

        res.status(200).json({
            success: true,
            message: "Profile update successfully!"
        })
    } catch (error) {
        return next(new AppError(error.message, 400))
    }

}

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}