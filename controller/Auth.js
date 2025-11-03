const User = require("../model/UserSchemas");
const Employer = require("../model/EmployerSchema");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../services/emailService");
require("dotenv").config();


exports.signup = async (req, res) => {
  try {
    const { email, password, role, ...otherData } = req.body;

    // Validate role
    if (role !== "jobseeker" && role !== "employer") {
      return res.status(400).json({ 
        message: "Role must be either 'jobseeker' or 'employer'" 
      });
    }

    // Check if user already exists in either collection
    const existingUser = role === "employer" 
      ? await Employer.findOne({ email })
      : await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ 
        message: "Account with this email already exists" 
      });
    }

    // Create new user based on role
    const Model = role === "employer" ? Employer : User;
    const userData = {
      email,
      password,
      role,
      name: otherData.name || otherData.fullName || email.split('@')[0], // Fallback to email username if no name provided
      ...(role === "employer" ? otherData : { ...otherData, fullName: otherData.name })
    };
    const newUser = new Model(userData);

    await newUser.save();

    // Fire-and-forget welcome email with clear logging for observability
    setImmediate(async () => {
      const recipientEmail = email;
      const recipientName = newUser.name || newUser.fullName || email.split('@')[0];
      const recipientRole = newUser.role;
      try {
        console.log('[WelcomeEmail] Triggering send', {
          email: recipientEmail,
          name: recipientName,
          role: recipientRole
        });
        const emailResult = await sendWelcomeEmail(
          recipientEmail,
          recipientName,
          recipientRole
        );
        if (emailResult?.success) {
          console.log('[WelcomeEmail] Sent successfully', {
            messageId: emailResult.messageId,
            email: recipientEmail
          });
        } else {
          console.error('[WelcomeEmail] Failed to send', {
            error: emailResult?.error || 'Unknown error',
            email: recipientEmail
          });
        }
      } catch (error) {
        console.error('[WelcomeEmail] Exception during send', {
          error: error?.message || error,
          stack: error?.stack,
          email: recipientEmail
        });
      }
    });

    const token = jwt.sign(
      { 
        id: newUser._id,
        role: newUser.role 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

   
    const userProfile = newUser.getPublicProfile();

    res.status(201).json({
      message: "Registration successful",
      user: {
        ...userProfile,
        points: role === "jobseeker" ? userProfile.rewards?.totalPoints || 0 : undefined,
        profileCompletion: role === "jobseeker" ? userProfile.rewards?.completeProfile || 0 : undefined,
      },
      token
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      message: "Registration failed", 
      error: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (role !== "jobseeker" && role !== "employer") {
      return res.status(400).json({ 
        message: "Role must be either 'jobseeker' or 'employer'" 
      });
    }

    if (role !== "jobseeker" && role !== "employer") {
      return res.status(400).json({ 
        message: "Role must be either 'jobseeker' or 'employer'" 
      });
    }

    // Find user based on role
    const Model = role === "employer" ? Employer : User;
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    // Check if user is blocked
    if (user.loginStatus === 'blocked') {
      return res.status(403).json({ 
        message: "Your account has been blocked. Please contact support.",
        blocked: true 
      });
    }

    // Direct password comparison
    if (user.password !== password) {
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    console.log("Login Response User:", user); // Add this for debugging

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Get public profile (excludes password)
    const userProfile = user.getPublicProfile();

    // Ensure name is always present in the response
    const name = userProfile.name || userProfile.fullName || email.split('@')[0];

    res.status(200).json({
      message: "Login successful",
      user: {
        ...userProfile,
        name, // Always include name
        points: role === "jobseeker" ? userProfile.rewards?.totalPoints || 0 : undefined,
        profileCompletion: role === "jobseeker" ? userProfile.rewards?.completeProfile || 0 : undefined,
      },
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Login failed", 
      error: error.message 
    });
  }
};

// Update Profile
// Complete employer profile
exports.completeEmployerProfile = async (req, res) => {
  try {
    const {
      companyName,
      industry,
      companySize,
      companyLocation,
      contactPerson,
      companyDescription,
      website,
      socialLinks,
    } = req.body;

    // Get employer ID from token
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    // Find employer and update profile
    const updatedEmployer = await Employer.findByIdAndUpdate(
      employerId,
      {
        $set: {
          companyName,
          industry,
          companySize,
          companyLocation,
          contactPerson,
          companyDescription,
          website,
          socialLinks,
          verificationStatus: "pending", // Set to pending for admin review
        }
      },
      { new: true }
    );

    if (!updatedEmployer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({
      message: "Employer profile completed successfully",
      user: updatedEmployer.getPublicProfile()
    });

  } catch (error) {
    console.error("Complete profile error:", error);
    res.status(500).json({ 
      message: "Failed to complete profile", 
      error: error.message 
    });
  }
};

// Update jobseeker profile
// Get User Profile Details
// exports.getUserProfileDetails = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized. Please login first." });
//     }

//     const user = await User.findById(userId).select('name email points profileCompleted membershipTier profilePicture');
    
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         name: user.name,
//         email: user.email,
//         points: user.points || 0,
//         profileCompleted: user.profileCompleted || "0",
//         membershipTier: user.membershipTier || "Blue",
//         profilePicture: user.profilePicture || ""
//       }
//     });

//   } catch (error) {
//     console.error("Get profile details error:", error);
//     res.status(500).json({ 
//       success: false,
//       message: "Failed to fetch profile details",
//       error: error.message 
//     });
//   }
// };

exports.getUserProfileDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const publicProfile = user.getPublicProfile();

    // Recalculate awaitingFeedback count to ensure accuracy
    const Application = require("../model/ApplicationSchema");
    const viewedApplicationsCount = await Application.countDocuments({
      applicantId: userId,
      viewedByEmployer: true
    });
    
    // Update the user's awaitingFeedback count if it's different
    if (publicProfile.applications?.awaitingFeedback !== viewedApplicationsCount) {
      await User.findByIdAndUpdate(userId, {
        'applications.awaitingFeedback': viewedApplicationsCount
      });
      // Update the publicProfile object
      if (!publicProfile.applications) publicProfile.applications = {};
      publicProfile.applications.awaitingFeedback = viewedApplicationsCount;
    }

    res.status(200).json({
      success: true,
      data: {
        email: publicProfile.email,
        role: publicProfile.role,
        name: publicProfile.name,
        profilePicture: publicProfile.profilePicture || "",
        fullName: publicProfile.fullName || "",
        phoneNumber: publicProfile.phoneNumber || "",
        location: publicProfile.location || "",
        dateOfBirth: publicProfile.dateOfBirth || null,
        nationality: publicProfile.nationality || "",
        emirateId: publicProfile.emirateId || "",
        passportNumber: publicProfile.passportNumber || "",
        introVideo: publicProfile.introVideo || "",
        resumeDocument: publicProfile.resumeDocument || "",
        professionalSummary: publicProfile.professionalSummary || "",
        refersLink: publicProfile.refersLink || "",
        referredMember: publicProfile.referredMember || "",
        professionalExperience: publicProfile.professionalExperience || [],
        education: publicProfile.education || [],
        skills: publicProfile.skills || [],
        certifications: publicProfile.certifications || [],
        jobPreferences: {
          preferredJobType: publicProfile.jobPreferences?.preferredJobType || [],
          salaryExpectation: publicProfile.jobPreferences?.salaryExpectation || "",
          preferredLocation: publicProfile.jobPreferences?.preferredLocation || "",
          availability: publicProfile.jobPreferences?.availability || "",
          resumeAndDocs: publicProfile.jobPreferences?.resumeAndDocs || [],
        },
        socialLinks: {
          linkedIn: publicProfile.socialLinks?.linkedIn || "",
          instagram: publicProfile.socialLinks?.instagram || "",
          twitterX: publicProfile.socialLinks?.twitterX || "",
        },
        rmService: publicProfile.rmService || "Inactive",
        rewards: {
          completeProfile: publicProfile.rewards?.completeProfile || 0,
          applyForJobs: publicProfile.rewards?.applyForJobs || 0,
          referFriend: publicProfile.rewards?.referFriend || 0,
          totalPoints: publicProfile.rewards?.totalPoints || 0,
        },
        linkedIn: user.linkedIn || false,
        instagram: user.instagram || false,
        referralRewardPoints: publicProfile.referralRewardPoints || 0,
        applications: {
          totalApplications: publicProfile.applications?.totalApplications || 0,
          activeApplications: publicProfile.applications?.activeApplications || 0,
          awaitingFeedback: publicProfile.applications?.awaitingFeedback || 0,
          appliedJobs: publicProfile.applications?.appliedJobs || [],
        },
        savedJobs: publicProfile.savedJobs || [],
        profileCompleted: publicProfile.profileCompleted || "0",
        points: publicProfile.points || 0,
        deductedPoints: publicProfile.deductedPoints || 0,
        membershipTier: publicProfile.membershipTier || "Blue",
      }
    });
  } catch (error) {
    console.error("Get profile details error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch profile details",
      error: error.message 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      location,
      dateOfBirth,
      nationality,
      emirateId,
      passportNumber,
      employmentVisa,
      introVideo,
      professionalSummary,

      // Professional Experience
      professionalExperience,

      // Education
      education,

      // Skills & Certifications
      skills,
      certifications,

      // Job Preferences
      jobPreferences,

      // Social Media Links
      socialLinks,
      
      // Profile Picture
      profilePicture,
      
      // Resume Document
      resumeDocument,
    } = req.body;

    // Get user ID from token
    const userId = req.user?.id; // You'll need to implement auth middleware to get this
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    // First update the profile fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          // Only update fields that are provided
          ...(fullName && { fullName }),
          ...(email && { email }),
          ...(phoneNumber && { phoneNumber }),
          ...(location && { location }),
          ...(dateOfBirth && { dateOfBirth }),
          ...(nationality && { nationality }),
          ...(emirateId && { emirateId }),
          ...(passportNumber && { passportNumber }),
          ...(introVideo && { introVideo }),
          ...(professionalSummary && { professionalSummary }),
          
          // Arrays and objects
          ...(professionalExperience && { professionalExperience }),
          ...(education && { education }),
          ...(skills && { skills }),
          ...(certifications && { certifications }),
          ...(jobPreferences && { jobPreferences }),
          ...(socialLinks && { socialLinks }),
          
          // Profile Picture
          ...(profilePicture && { profilePicture }),
          
          // Resume Document
          ...(resumeDocument && { resumeDocument }),
        }
      },
      { new: true } // Return updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate profile completion based on the updated user data
    // Match frontend calculation logic (24 total fields - employmentVisa removed)
    let completed = 0;
    const totalFields = 24;

    // Personal Info (9 fields) - matching frontend logic exactly
    if (updatedUser.fullName) completed++;
    if (updatedUser.email) completed++;
    if (updatedUser.phoneNumber) completed++;
    if (updatedUser.location) completed++;
    if (updatedUser.dateOfBirth) completed++;
    if (updatedUser.nationality) completed++;
    if (updatedUser.professionalSummary) completed++;
    if (updatedUser.emirateId) completed++;
    if (updatedUser.passportNumber) completed++;
    
    // Experience (4 fields)
    if (updatedUser.professionalExperience && updatedUser.professionalExperience.length > 0) {
      const exp = updatedUser.professionalExperience[0];
      if (exp?.currentRole) completed++;
      if (exp?.company) completed++;
      if (exp?.yearsOfExperience) completed++;
      if (exp?.industry) completed++;
    }

    // Education (4 fields)  
    if (updatedUser.education && updatedUser.education.length > 0) {
      const edu = updatedUser.education[0];
      if (edu?.highestDegree) completed++;
      if (edu?.institution) completed++;
      if (edu?.yearOfGraduation) completed++;
      if (edu?.gradeCgpa) completed++;
    }

    // Skills, Preferences, Certifications, Resume (4 fields)
    if (updatedUser.skills && updatedUser.skills.length > 0) completed++;
    if (updatedUser.jobPreferences?.preferredJobType && updatedUser.jobPreferences.preferredJobType.length > 0) completed++;
    if (updatedUser.certifications && updatedUser.certifications.length > 0) completed++;
    if (updatedUser.jobPreferences?.resumeAndDocs && updatedUser.jobPreferences.resumeAndDocs.length > 0) completed++;

    // Social Links (3 fields)
    if (updatedUser.socialLinks?.linkedIn) completed++;
    if (updatedUser.socialLinks?.instagram) completed++;
    if (updatedUser.socialLinks?.twitterX) completed++;

    // Calculate percentage and points to match frontend
    const percentage = Math.round((completed / totalFields) * 100);
    const calculatedPoints = 50 + (percentage * 2); // Base 50 + 2 points per percentage (100% = 250 points)
    const applicationPoints = updatedUser?.rewards?.applyForJobs || 0; // Points from job applications
    const rmServicePoints = updatedUser?.rewards?.rmService || 0; // Points from RM service purchase
    const socialMediaBonus = updatedUser?.rewards?.socialMediaBonus || 0; // Bonus points from following social media
    const totalPoints = calculatedPoints + applicationPoints + rmServicePoints + socialMediaBonus;
    const calculatedProfileCompleted = percentage.toString();

    // Update the user with calculated points and profile completion
    // Preserve socialMediaBonus if it exists, otherwise initialize it
    const updateData = {
      'rewards.completeProfile': calculatedPoints,
      'rewards.totalPoints': totalPoints,
      'points': totalPoints,
      'profileCompleted': calculatedProfileCompleted
    };

    // Preserve socialMediaBonus if it exists
    if (updatedUser?.rewards?.socialMediaBonus !== undefined) {
      updateData['rewards.socialMediaBonus'] = updatedUser.rewards.socialMediaBonus;
    }

    const finalUpdatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateData
      },
      { new: true } // Return updated document
    );

    if (!finalUpdatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      data: finalUpdatedUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

// Check profile eligibility for job applications
exports.checkProfileEligibility = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized. Please login first." 
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Calculate profile completion based on the same logic as updateProfile
    let completed = 0;
    const totalFields = 24;
    const missingFields = [];

    // Personal Info (9 fields) - matching frontend logic exactly
    if (user.fullName) completed++; else missingFields.push("Full Name");
    if (user.email) completed++; else missingFields.push("Email");
    if (user.phoneNumber) completed++; else missingFields.push("Phone Number");
    if (user.location) completed++; else missingFields.push("Location");
    if (user.dateOfBirth) completed++; else missingFields.push("Date of Birth");
    if (user.nationality) completed++; else missingFields.push("Nationality");
    if (user.professionalSummary) completed++; else missingFields.push("Professional Summary");
    if (user.emirateId) completed++; else missingFields.push("Emirates ID");
    if (user.passportNumber) completed++; else missingFields.push("Passport Number");

    // Experience (4 fields)
    const exp = user.professionalExperience?.[0];
    if (exp?.currentRole) completed++; else missingFields.push("Current Role");
    if (exp?.company) completed++; else missingFields.push("Company");
    if (exp?.yearsOfExperience) completed++; else missingFields.push("Years of Experience");
    if (exp?.industry) completed++; else missingFields.push("Industry");

    // Education (4 fields)
    const edu = user.education?.[0];
    if (edu?.highestDegree) completed++; else missingFields.push("Highest Degree");
    if (edu?.institution) completed++; else missingFields.push("Institution");
    if (edu?.yearOfGraduation) completed++; else missingFields.push("Year of Graduation");
    if (edu?.gradeCgpa) completed++; else missingFields.push("Grade/CGPA");

    // Skills, Preferences, Certifications (3 fields)
    if (user.skills && user.skills.length > 0) completed++; else missingFields.push("Skills");
    if (user.jobPreferences?.preferredJobType && user.jobPreferences.preferredJobType.length > 0) completed++; else missingFields.push("Job Preferences");
    if (user.certifications && user.certifications.length > 0) completed++; else missingFields.push("Certifications");

    // Resume check - comprehensive check for all possible resume locations
    const hasResume = !!(user.resumeDocument && user.resumeDocument.trim() !== '') ||
                     !!(user.resumeUrl && user.resumeUrl.trim() !== '') ||
                     !!(user.resume && (typeof user.resume === 'string' ? user.resume.trim() !== '' : user.resume)) ||
                     !!(user.jobPreferences?.resumeAndDocs && user.jobPreferences.resumeAndDocs.length > 0);
    
    if (hasResume) completed++; else missingFields.push("Resume (Required for job applications)");

    // Social Links (3 fields)
    if (user.socialLinks?.linkedIn) completed++; else missingFields.push("LinkedIn");
    if (user.socialLinks?.instagram) completed++; else missingFields.push("Instagram");
    if (user.socialLinks?.twitterX) completed++; else missingFields.push("Twitter/X");

    const percentage = Math.round((completed / totalFields) * 100);
    const canApply = percentage >= 80 && hasResume;

    // Debug logging for troubleshooting
    console.log('📊 PROFILE ELIGIBILITY CHECK:', {
      userId: userId,
      completed: completed,
      totalFields: totalFields,
      percentage: percentage,
      hasResume: hasResume,
      canApply: canApply,
      resumeFields: {
        resumeDocument: user.resumeDocument,
        resumeUrl: user.resumeUrl,
        resume: user.resume,
        resumeAndDocs: user.jobPreferences?.resumeAndDocs
      }
    });

    res.status(200).json({
      success: true,
      data: {
        canApply: canApply,
        profileCompletion: {
          percentage: percentage,
          completed: completed,
          total: totalFields,
          missingFields: missingFields
        },
        resumeStatus: {
          hasResume: hasResume,
          resumeDocument: user.resumeDocument || null,
          resumeUrl: user.resumeUrl || null,
          resumeAndDocs: user.jobPreferences?.resumeAndDocs || []
        }
      }
    });

  } catch (error) {
    console.error("Check profile eligibility error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to check profile eligibility",
      error: error.message 
    });
  }
};

// Forgot Password - Send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Find user in both collections
    let user = await User.findOne({ email });
    let userRole = 'jobseeker';
    
    if (!user) {
      user = await Employer.findOne({ email });
      userRole = 'employer';
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(
      email, 
      resetToken, 
      user.name || user.fullName || 'User'
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Still return success to user for security (don't reveal if email exists)
      return res.status(200).json({
        success: true,
        message: "Password reset link sent to your email",
        // In development, also return the URL for testing
        resetUrl: process.env.NODE_ENV === 'development' ? 
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/reset-password?token=${resetToken}` : 
          undefined
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
      // In development, also return the URL for testing
      resetUrl: process.env.NODE_ENV === 'development' ? 
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/reset-password?token=${resetToken}` : 
        undefined
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
      error: error.message
    });
  }
};

// Validate Reset Token
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required"
      });
    }

    // Find user with valid reset token
    let user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      user = await Employer.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() }
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    res.status(200).json({
      success: true,
      message: "Reset token is valid"
    });

  } catch (error) {
    console.error("Validate reset token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate reset token",
      error: error.message
    });
  }
};

// Follow Social Media - Award points for following LinkedIn/Instagram
exports.followSocialMedia = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { platform } = req.body; // 'linkedIn' or 'instagram'

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first."
      });
    }

    if (!platform || !['linkedIn', 'instagram'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform. Must be 'linkedIn' or 'instagram'"
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user already followed this platform
    const fieldName = platform === 'linkedIn' ? 'linkedIn' : 'instagram';
    const alreadyFollowed = user[fieldName] === true;

    let pointsAwarded = 0;
    let message = "";

    if (!alreadyFollowed) {
      // Set the field to true
      user[fieldName] = true;
      
      // Award 10 points
      pointsAwarded = 10;
      
      // Initialize rewards if it doesn't exist
      if (!user.rewards) {
        user.rewards = {
          completeProfile: 0,
          applyForJobs: 0,
          referFriend: 0,
          totalPoints: 0,
          socialMediaBonus: 0
        };
      }

      // Add bonus points to existing socialMediaBonus
      const currentSocialBonus = user.rewards.socialMediaBonus || 0;
      user.rewards.socialMediaBonus = currentSocialBonus + pointsAwarded;
      
      // Get current total points from user.points (this includes all previous bonuses)
      const currentTotalPoints = user.points || 0;
      
      // Add the new bonus points to existing total
      const newTotalPoints = currentTotalPoints + pointsAwarded;
      
      // Update user points and rewards
      user.points = newTotalPoints;
      user.rewards.totalPoints = newTotalPoints;
      
      // Save to database
      await user.save();

      message = `Successfully followed us on ${platform === 'linkedIn' ? 'LinkedIn' : 'Instagram'}! You earned ${pointsAwarded} bonus points.`;
    } else {
      message = `You have already followed us on ${platform === 'linkedIn' ? 'LinkedIn' : 'Instagram'}.`;
    }

    // Get updated points
    const updatedUser = await User.findById(userId);
    const totalPoints = updatedUser.points || 0;

    res.status(200).json({
      success: true,
      message,
      data: {
        platform,
        pointsAwarded,
        totalPoints,
        alreadyFollowed
      }
    });

  } catch (error) {
    console.error("Follow social media error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process follow action",
      error: error.message
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required"
      });
    }

    // Find user with valid reset token
    let user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      user = await Employer.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() }
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message
    });
  }
};

