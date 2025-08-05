import RegisterUserService from "../services/user.service.js";
import cleanUpUser from "../utils/cleanUpUser.js";
import userFinder from "../utils/userFinder.js";
import { validationResult } from "express-validator";
import sendEmail from "./../utils/EmailSender.js";
import createOtp from "../utils/OtpMaker.js";
import crypto from "crypto";
import { uploadImage } from "../db/cloudinary-connection.js";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/user.model.js";
import redisClient from '../services/redis.service.js';
import getGroupStage from "../utils/GetGroupStage.js";



const Register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, email, password } = req.body;
  const ExistingUser = await userFinder({
    key: "email",
    query: email.toLowerCase().trim(),
    lean: true,
    select: "email",
  });
  if (ExistingUser) {
    return res
      .status(406)
      .json({ message: "User already Exist, please Login." });
  }
  const otp = createOtp(6);
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  const newUser = await RegisterUserService({
    name,
    email,
    password,
    otp: hashedOtp,
  });
  res.status(201).json("Okk");
  await sendEmail({
    email,
    sub: "OTP Recive",
    mess: `Your OTP is ${otp}`,
  });
};

const Login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  const user = await userFinder({
    key: "email",
    query: email.toLowerCase().trim(),
    includePassword: true,
  });
  if (!user)
    return res
      .status(404)
      .json({ message: "email or password something wrong!" });
  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res.status(404).json("email or password something wrong!");
  const otp = createOtp(6);
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  user.otp = hashedOtp;
  user.otpExpiry = Date.now() + +process.env.OTP_EXPIRY_MS;
  await user.save();
  res.status(200).json("Valid");
  await sendEmail({
    email,
    sub: "OTP Recive",
    mess: `Your OTP is ${otp}`,
  });
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await userFinder({
    key: "email",
    query: email.toLowerCase().trim(),
  });
  if (!user)
    return res
      .status(404)
      .json({ message: "email or password something wrong!" });
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  if (!user || user.otp !== hashedOtp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }
  user.otp = null;
  user.otpExpiry = null;
  await user.save();
  const token = user.generateToken();
  res.json({
    message: "OTP verified successfully",
    token,
    user: cleanUpUser(user),
  });
};

const resendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await userFinder({
    key: "email",
    query: email.toLowerCase().trim(),
  });
  if (!user)
    return res.status(404).json({ message: "Something Wrong! try again." });
  const otp = createOtp(6);
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  user.otp = hashedOtp;
  user.otpExpiry = Date.now() + +process.env.OTP_EXPIRY_MS;
  await user.save();
  res.status(200).json({ message: "OTP Resend, Succesfully!" });
  await sendEmail({
    email,
    sub: "Resend OTP",
    mess: `Your Resend OTP is ${otp}`,
  });
};

const GetProfile = async (req, res) => {
  const user = await userFinder({
    key: "_id",
    query: req.user._id,
    lean: true,
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.block) {
    return res.status(403).json({ message: "User is blocked" });
  }
  const userCleaned = cleanUpUser(user, true);
  return res.status(200).json({
    user: userCleaned,
  });
};

const profileEdit = async (req, res) => {
  const { name, bio, currentPassword, confirmPassword } = req.body;
  const File = req.file;
  const user = await userFinder({
    key: "email",
    query: req.user.email,
    includePassword: true,
  });
  let avatarUrl = user.profileImage;
  let avatarPublicId = user.profileImagePublicId;
  if (File) {
    try {
      if (avatarPublicId) {
        await cloudinary.uploader.destroy(avatarPublicId);
      }
      const result = await uploadImage(File.buffer, {
        public_id: `user_${user._id}_profilePic`,
        folder: "users/ProfilePic",
      });
      avatarUrl = result.secure_url;
      avatarPublicId = result.public_id;
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return res.status(500).json({ message: "Image upload failed" });
    }
  }

  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (avatarUrl) user.profileImage = avatarUrl;
  if (avatarPublicId) user.profileImagePublicId = avatarPublicId;

  if (currentPassword && confirmPassword) {
    const isMatch = await user.ComparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    const hashedPassword = await User.hashPassword(confirmPassword);
    user.password = hashedPassword;
  }

  await user.save();
  res.status(200).json({
    user: cleanUpUser(user),
  });
  return res
    .status(200)
    .json({ message: "Profile updated successfully", user: cleanUpUser(user) });
};

const logOut = async (req,res)=>{
  const token = req.cookies.token || req.headers.authorization.split(" ")[1];
  redisClient.set(token, "logout","EX", 60*60*24)
  res.status(200).json("LogOut successfully.")
}

const analytics = async (req, res) => {
  const filter = req.query.filter?.toLowerCase() || "weekly";
  const groupBy = getGroupStage(filter);

  try {
    const result = await User.aggregate([
      { $match: { createdAt: { $exists: true } } },
      { $group: { _id: groupBy, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } },
    ]);

    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "User analytics error", error: err.message });
  }
};


const SearchPeople = async (req, res) => {
  const { query = "", page = 1 } = req.query;
  const limit = 10;
  const skip = (page - 1) * limit;


  try {
    const users = await User.find({
      $or: [
        { name: { $regex: `^${query}`, $options: "i" } },
        { email: { $regex: `^${query}`, $options: "i" } },
      ],
    })
      .select("name email number block")
      .lean()
      .skip(skip)
      .limit(limit + 1);

    const hasMore = users.length > limit;

    if (hasMore) users.pop();

    res.json({ users, hasMore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};



export {
  Register,
  Login,
  verifyOtp,
  GetProfile,
  resendOtp,
  profileEdit,
  logOut,
  analytics,
  SearchPeople,
};
