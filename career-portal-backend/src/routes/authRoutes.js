const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/login", authController.login);

router.post("/register", authController.registerUser);
router.get("/validate-invite", authController.validateInviteToken);
router.post("/register-recruiter", authController.registerRecruiter);
/* Forgot password routes */
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;