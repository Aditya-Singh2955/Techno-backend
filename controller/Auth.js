const User = require("../model/UserSchemas");
const Employer = require("../model/EmployerSchema");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Signup route
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser._id,
        role: newUser.role 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Get public profile (excludes password)
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
    
    // Validate role
    if (role !== "jobseeker" && role !== "employer") {
      return res.status(400).json({ 
        message: "Role must be either 'jobseeker' or 'employer'" 
      });
    }

    // Validate role
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
        employmentVisa: publicProfile.employmentVisa || "",
        introVideo: publicProfile.introVideo || "",
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
          ...(employmentVisa && { employmentVisa }),
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
    // Match frontend calculation logic (25 total fields)
    let completed = 0;
    const totalFields = 25;

    // Personal Info (10 fields) - matching frontend logic exactly
    if (updatedUser.fullName) completed++;
    if (updatedUser.email) completed++;
    if (updatedUser.phoneNumber) completed++;
    if (updatedUser.location) completed++;
    if (updatedUser.dateOfBirth) completed++;
    if (updatedUser.nationality) completed++;
    if (updatedUser.professionalSummary) completed++;
    if (updatedUser.emirateId) completed++;
    if (updatedUser.passportNumber) completed++;
    if (updatedUser.employmentVisa) completed++;
    
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
    const calculatedPoints = 50 + (percentage * 2); // Base 50 + 2 points per percentage
    const calculatedProfileCompleted = percentage.toString();

    // Update the user with calculated points and profile completion
    const finalUpdatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'rewards.completeProfile': calculatedPoints,
          'rewards.totalPoints': calculatedPoints,
          'points': calculatedPoints,
          'profileCompleted': calculatedProfileCompleted
        }
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
    const totalFields = 25;
    const missingFields = [];

    // Personal Info (10 fields) - matching frontend logic exactly
    if (user.fullName) completed++; else missingFields.push("Full Name");
    if (user.email) completed++; else missingFields.push("Email");
    if (user.phoneNumber) completed++; else missingFields.push("Phone Number");
    if (user.location) completed++; else missingFields.push("Location");
    if (user.dateOfBirth) completed++; else missingFields.push("Date of Birth");
    if (user.nationality) completed++; else missingFields.push("Nationality");
    if (user.professionalSummary) completed++; else missingFields.push("Professional Summary");
    if (user.emirateId) completed++; else missingFields.push("Emirates ID");
    if (user.passportNumber) completed++; else missingFields.push("Passport Number");
    if (user.employmentVisa) completed++; else missingFields.push("Employment Visa");

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

