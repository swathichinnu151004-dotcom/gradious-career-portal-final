const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const recruiterController = require("../controllers/recruiterController"); // ✅ ADD THIS

// Auth routes
router.get("/google-client-id", authController.getGoogleClientId);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.post("/register", authController.registerUser);

// Recruiter invite routes
router.get("/validate-invite", recruiterController.validateInviteToken);
router.post("/register-recruiter", recruiterController.completeRecruiterSignup);

// Forgot password routes
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;