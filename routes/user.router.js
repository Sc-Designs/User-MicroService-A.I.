import express from "express";
import multer from "multer";
import tryCatch from "../utils/tryCatch.js";
import {
  GetProfile,
  Login,
  Register,
  verifyOtp,
  resendOtp,
  profileEdit,
  analytics,
  SearchPeople,
  logOut,
} from "../controllers/user.controller.js";
import { body } from "express-validator";
import logerAuthenticate from "../middleware/isLoggedInUser.js";
import isAdminLoggedIn from "../middleware/isAdminLoggedIn.js";

const router = express.Router();
const upload = multer();

router.post(
  "/register",
  [
    body("name")
      .isLength({ min: 3 })
      .withMessage("Name must above of 3 Charecters"),
    body("email").isEmail().withMessage("Email is not verified"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must above of 6 Charecters"),
  ],
  tryCatch(Register)
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email is not verified"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must above of 6 Charecters"),
  ],
  tryCatch(Login)
);

router.post(
  "/verify-otp",
  [
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("otp must be 6 charecters"),
    body("email").isEmail(),
  ],
  tryCatch(verifyOtp)
);

router.post("/resend-otp", [body("email").isEmail()], tryCatch(resendOtp));

router.post(
  "/edit",
  logerAuthenticate,
  upload.single("avatar"),
  tryCatch(profileEdit)
);

router.get("/analytics", logerAuthenticate, tryCatch(analytics));

router.get("/profile",
  logerAuthenticate, tryCatch(GetProfile)
  );

router.get("/search", isAdminLoggedIn, tryCatch(SearchPeople));

router.get("/log-out", tryCatch(logOut));
export default router;
