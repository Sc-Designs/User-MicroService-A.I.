import User from "../models/user.model.js";
import { BadRequestError } from "../utils/errors.js";

const RegisterUserService = async ({ name, email, password,otp }) => {
  if (
    (!name || name == null || name == undefined) &&
    (!email || email == null || email == undefined) &&
    (!password || password == null || password == undefined)
  ) {
    throw new BadRequestError();
  }
  const hashedPassword = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    otp,
    otpExpiry: Date.now() + Number(process.env.OTP_EXPIRY_MS),
  });
  return user;
};

export default RegisterUserService;
