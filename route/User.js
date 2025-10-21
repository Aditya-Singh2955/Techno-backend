const express = require("express");
const router = express.Router();
const { signup, login, updateProfile, getUserProfileDetails, checkProfileEligibility } = require("../controller/Auth");
const authMiddleware = require("../middleware/auth");

// Auth routes
router.post("/signup", signup);
router.post("/login", login);

// Profile routes (protected)
router.put("/profile/update", authMiddleware, updateProfile);
router.get("/profile/details", authMiddleware, getUserProfileDetails);
router.get("/profile/eligibility", authMiddleware, checkProfileEligibility);

module.exports = router;
