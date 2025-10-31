const User = require("../model/UserSchemas");

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { service, price, pointsUsed, couponCode, totalAmount } = req.body;
    const userId = req.user.id;

    // Get user data to check points balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate user's actual points based on profile completion (same as frontend)
    const calculateProfilePoints = (profile) => {
      let completed = 0;
      const totalFields = 25;

      // Personal Info (10 fields)
      if (profile?.fullName) completed++;
      if (profile?.email) completed++;
      if (profile?.phoneNumber) completed++;
      if (profile?.location) completed++;
      if (profile?.dateOfBirth) completed++;
      if (profile?.nationality) completed++;
      if (profile?.professionalSummary) completed++;
      if (profile?.emirateId) completed++;
      if (profile?.passportNumber) completed++;
      if (profile?.employmentVisa) completed++;

      // Experience (4 fields)
      const exp = profile?.professionalExperience?.[0];
      if (exp?.currentRole) completed++;
      if (exp?.company) completed++;
      if (exp?.yearsOfExperience) completed++;
      if (exp?.industry) completed++;

      // Education (4 fields)
      const edu = profile?.education?.[0];
      if (edu?.highestDegree) completed++;
      if (edu?.institution) completed++;
      if (edu?.yearOfGraduation) completed++;
      if (edu?.gradeCgpa) completed++;

      // Skills, Preferences, Certifications, Resume (4 fields)
      if (profile?.skills && profile.skills.length > 0) completed++;
      if (profile?.jobPreferences?.preferredJobType && profile.jobPreferences.preferredJobType.length > 0) completed++;
      if (profile?.certifications && profile.certifications.length > 0) completed++;
      if (profile?.jobPreferences?.resumeAndDocs && profile.jobPreferences.resumeAndDocs.length > 0) completed++;

      // Social Links (3 fields)
      if (profile?.socialLinks?.linkedIn) completed++;
      if (profile?.socialLinks?.instagram) completed++;
      if (profile?.socialLinks?.twitterX) completed++;

      const percentage = Math.round((completed / totalFields) * 100);
      const calculatedPoints = 50 + percentage * 2; // Base 50 + 2 points per percentage (100% = 250 points)
      const applicationPoints = profile?.rewards?.applyForJobs || 0; // Points from job applications
      const rmServicePoints = profile?.rewards?.rmService || 0; // Points from RM service purchase
      const totalPoints = calculatedPoints + applicationPoints + rmServicePoints;

      return totalPoints;
    };

    const userPoints = calculateProfilePoints(user);
    
    if (pointsUsed > 0 && pointsUsed > userPoints) {
      return res.status(400).json({ 
        message: "Insufficient points", 
        availablePoints: userPoints 
      });
    }

    // Create order object
    const order = {
      service,
      price,
      pointsUsed,
      couponCode,
      totalAmount,
      orderDate: new Date(),
      status: "completed"
    };

    // For calculated points, we need to track deducted points separately
    // Since points are calculated from profile completion, we'll store the deducted amount
    const currentDeductedPoints = user.deductedPoints || 0;
    const newDeductedPoints = currentDeductedPoints + pointsUsed;
    const availablePoints = userPoints - newDeductedPoints;
    
    
    const updateResult = await User.findByIdAndUpdate(userId, {
      $set: {
        "deductedPoints": newDeductedPoints,
        "rmService": "Active" // Activate RM Service
      },
      $inc: {
        "rewards.rmService": 100, // Award 100 points for purchasing RM service
        "rewards.totalPoints": 100 // Add to total points
      },
      $push: {
        orders: order
      }
    }, { new: true });
    

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order,
        remainingPoints: availablePoints + 100, // Add the 100 points awarded
        pointsAwarded: 100
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to place order", 
      error: error.message 
    });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('orders rmService');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        orders: user.orders || [],
        rmService: user.rmService || "inactive"
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch orders", 
      error: error.message 
    });
  }
};

