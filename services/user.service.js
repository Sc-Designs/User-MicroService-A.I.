import User from "../models/user.model.js";
import { BadRequestError } from "../utils/errors.js";

const RegisterUserService = async ({ name, email, password }) => {
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
  });
  return user;
};

export default RegisterUserService;
