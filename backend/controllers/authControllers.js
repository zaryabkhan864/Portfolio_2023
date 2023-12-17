import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import User from '../models/user.js';
import { getResetPasswordTemplate } from '../utils/emailTemplates.js';
import ErrorHandler from '../utils/errorHandler.js';
import sendToken from '../utils/sendToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// Register a user   =>   /api/v1/register
export const registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;
    const user = await User.create({
        name,
        email,
        password,
        // avatar: {
        //     public_id: "avatars/kb6xqkqzg2v9s7kzqk2u",
        //     url: "https://res.cloudinary.com/dxkufsejm/image/upload/v1627774757/avatars/kb6xqkqzg2v9s7kzqk2u.jpg"
        // }
    });
    sendToken(user, 201, res);
});
// Login user   =>   /api/v1/login
export const loginUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Please enter email & password", 400));
    }
    //Find user in database
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }
    //Check if password is correct or not
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }
    sendToken(user, 201, res);
});
// Logout user   =>   /api/v1/logout
export const logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });
    res.status(200).json({
        success: true,
        message: "Logged Out"
    })
});

// Forget password   =>   /api/v1/password/forget
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
    //Find user in database
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorHandler("user not found with this email", 404));
    }
    // Get reset password token
    const reset = user.getResetPasswordToken();
    await user.save();

    // Create reset password url
    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${reset}`;

    const message = getResetPasswordTemplate(user?.name, resetUrl);
    try {
        await sendEmail({
            email: user.email,
            subject: "ShopIT Password Recovery",
            message
        });
        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        return next(new ErrorHandler(error?.message, 500));
    }

});
// Reset password   =>   /api/v1/password/reset/:token
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
    //Hash URL token
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) {
        return next(new ErrorHandler("Password reset token is invalid or has been expired", 400));
    }
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400));
    }
    //Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendToken(user, 200, res);
});
// Get current user profile   =>   /api/v1/me
export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req?.user?.id);
    res.status(200).json({
        success: true,
        user
    })
});
// Update / Change password   =>   /api/v1/password/update
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req?.user?.id).select("+password");
    //Check previous user password
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }
    user.password = req.body.password;
    await user.save();
    sendToken(user, 200, res);
});
// Update user profile   =>   /api/v1/me/update
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req?.user?.id);
    user.name = req.body.name;
    user.email = req.body.email;
    await user.save();
    res.status(200).json({
        success: true
    })
});
// Update user profile   =>   /api/v1/admin/users
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }
    const user = await User.findByIdAndUpdate(req.user._id, newUserData, {
        new: true,
    });
    res.status(200).json({
        success: true,
        user
    })
});

// Get all users - ADMIN  =>   /api/v1/admin/users
export const allUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
});

// Get user details - ADMIN  =>   /api/v1/admin/user/:id

export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`));
    }
    res.status(200).json({
        success: true,
        user
    })
});
// Update user details - ADMIN  =>   /api/v1/admin/user/:id
export const updateUser = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,

    });
    res.status(200).json({
        success: true,
        user
    })
});
// Delete user - ADMIN  =>   /api/v1/admin/user/:id
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`));
    }
    //Remove avatar from cloudinary
    // const image_id = user.avatar.public_id;
    // await cloudinary.v2.uploader.destroy(image_id);
    await user.remove();
    res.status(200).json({
        success: true,
    })
});
