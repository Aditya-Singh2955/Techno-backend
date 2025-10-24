const express = require("express");
const router = express.Router();
const FindrUser = require("../model/UserSchemas");
const Employer = require("../model/EmployerSchema");
const Job = require("../model/JobSchema");
const Application = require("../model/ApplicationSchema");
const QuoteRequest = require("../model/QuoteRequestSchema");

// Admin Users Endpoint - Get users by type
router.get("/admin/users/:userType", async (req, res) => {
  try {
    const { userType } = req.params;
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Validate userType parameter
    if (!['jobseeker', 'employer'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type. Must be 'jobseeker' or 'employer'"
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    let users, totalCount;

    if (userType === 'jobseeker') {
      // Build search query for jobseekers
      const searchQuery = search ? {
        role: "jobseeker",
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { nationality: { $regex: search, $options: 'i' } },
          { 'professionalExperience.currentRole': { $regex: search, $options: 'i' } },
          { 'professionalExperience.company': { $regex: search, $options: 'i' } },
          { 'professionalExperience.industry': { $regex: search, $options: 'i' } }
        ]
      } : { role: "jobseeker" };

      // Get jobseekers with pagination and sorting
      [users, totalCount] = await Promise.all([
        FindrUser.find(searchQuery)
          .select('_id name fullName email phoneNumber location nationality professionalExperience profilePicture loginStatus createdAt updatedAt')
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        FindrUser.countDocuments(searchQuery)
      ]);

      // Transform jobseeker data to match frontend expectations
      users = users.map(user => ({
        id: user._id.toString(),
        fullName: user.fullName || user.name || 'N/A',
        emailAddress: user.email,
        phoneNumber: user.phoneNumber || 'N/A',
        location: user.location || 'N/A',
        nationality: user.nationality || 'N/A',
        currentRole: user.professionalExperience?.[0]?.currentRole || 'N/A',
        company: user.professionalExperience?.[0]?.company || 'N/A',
        yearsOfExperience: user.professionalExperience?.[0]?.yearsOfExperience || 0,
        industry: user.professionalExperience?.[0]?.industry || 'N/A',
        profileUrl: `/candidate/${user._id}`,
        loginStatus: user.loginStatus || 'active',
        profileImage: user.profilePicture || '',
        joinedDate: user.createdAt,
        lastActive: user.updatedAt
      }));

    } else if (userType === 'employer') {
      // Build search query for employers
      const searchQuery = search ? {
        $or: [
          { companyName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { companyEmail: { $regex: search, $options: 'i' } },
          { industry: { $regex: search, $options: 'i' } },
          { website: { $regex: search, $options: 'i' } },
          { companyLocation: { $regex: search, $options: 'i' } }
        ]
      } : {};

      // Get employers with pagination and sorting
      [users, totalCount] = await Promise.all([
        Employer.find(searchQuery)
          .select('_id companyName email companyEmail phoneNumber website industry teamSize foundedYear companyLocation companyLogo verificationStatus loginStatus createdAt updatedAt')
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Employer.countDocuments(searchQuery)
      ]);

      // Transform employer data to match frontend expectations
      users = users.map(employer => ({
        id: employer._id.toString(),
        companyName: employer.companyName ,
        companyEmail: employer.companyEmail || employer.email,
        phoneNumber: employer.phoneNumber || 'N/A',
        website: employer.website || 'N/A',
        industry: employer.industry || 'N/A',
        teamSize: employer.teamSize || 'N/A',
        foundedYear: employer.foundedYear || 'N/A',
        location: employer.companyLocation || 'N/A',
        profileUrl: `/employer/profile/${employer._id}`,
        loginStatus: employer.loginStatus ,
        companyLogo: employer.companyLogo ,
        joinedDate: employer.createdAt,
        lastActive: employer.updatedAt
      }));
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      },
      message: `${userType} data fetched successfully`
    });

  } catch (error) {
    console.error(`Error fetching ${req.params.userType} data:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching user data",
      error: error.message
    });
  }
});

// Admin Dashboard Statistics Endpoint
router.get("/admin/dashboard/stats", async (req, res) => {
  try {
    // Get all counts in parallel for better performance
    const [
      jobseekerCount,
      employerCount,
      activeJobsCount,
      applicationsCount,
      servicesOrdersCount,
      premiumOrdersCount
    ] = await Promise.all([
      // Count jobseekers
      FindrUser.countDocuments({ role: "jobseeker" }),
      
      // Count employers
      Employer.countDocuments({ role: "employer" }),
      
      // Count active jobs
      Job.countDocuments({ status: "active" }),
      
      // Count total applications
      Application.countDocuments(),
      
      // Count services & orders (HR services from employers)
      Employer.countDocuments({ 
        "hrServices": { 
          $elemMatch: { 
            status: { $in: ["active", "pending"] } 
          } 
        } 
      }),
      
      // Count premium orders (users with premium subscriptions or paid services)
      Promise.all([
        Employer.countDocuments({ 
          subscriptionPlan: { $in: ["basic", "premium", "enterprise"] },
          subscriptionStatus: "active"
        }),
        FindrUser.countDocuments({ 
          rmService: "Active" 
        })
      ]).then(([premiumEmployers, rmUsers]) => premiumEmployers + rmUsers)
    ]);

    const stats = {
      jobseekers: jobseekerCount,
      employers: employerCount,
      activeJobs: activeJobsCount,
      applications: applicationsCount,
      servicesOrders: servicesOrdersCount,
      premiumOrders: premiumOrdersCount
    };

    res.status(200).json({
      success: true,
      data: stats,
      message: "Admin dashboard statistics fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching dashboard statistics",
      error: error.message
    });
  }
});

// Additional endpoint for detailed analytics (optional)
router.get("/admin/dashboard/analytics", async (req, res) => {
  try {
    const [
      recentApplications,
      recentJobs,
      topEmployers,
      userGrowth
    ] = await Promise.all([
      // Recent applications (last 7 days)
      Application.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // Recent jobs posted (last 7 days)
      Job.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // Top employers by job count
      Job.aggregate([
        { $group: { _id: "$employer", jobCount: { $sum: 1 } } },
        { $sort: { jobCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "employers",
            localField: "_id",
            foreignField: "_id",
            as: "employerInfo"
          }
        }
      ]),
      
      // User growth (last 30 days)
      Promise.all([
        FindrUser.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        Employer.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]).then(([newJobseekers, newEmployers]) => ({
        newJobseekers,
        newEmployers,
        total: newJobseekers + newEmployers
      }))
    ]);

    const analytics = {
      recentApplications,
      recentJobs,
      topEmployers,
      userGrowth
    };

    res.status(200).json({
      success: true,
      data: analytics,
      message: "Admin dashboard analytics fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching admin dashboard analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching dashboard analytics",
      error: error.message
    });
  }
});

// Admin Jobs Endpoint - Get all active jobs
router.get("/admin/jobs", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc', status = 'active' } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Build search query
    const searchQuery = {
      status: status === 'all' ? { $in: ['active', 'paused', 'closed'] } : status,
      ...(search && {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { skills: { $in: [new RegExp(search, 'i')] } },
          { requirements: { $in: [new RegExp(search, 'i')] } }
        ]
      })
    };

    // Get jobs with pagination and sorting
    const [jobs, totalCount] = await Promise.all([
      Job.find(searchQuery)
        .populate('employer', 'companyName email companyLogo')
        .select('_id title companyName location jobType salary description requirements benefits skills applicationDeadline status views createdAt updatedAt')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Job.countDocuments(searchQuery)
    ]);

    // Transform job data to match frontend expectations
    const transformedJobs = jobs.map(job => ({
      id: job._id.toString(),
      jobTitle: job.title,
      companyName: job.companyName || job.employer?.companyName || 'N/A',
      location: job.location,
      jobType: Array.isArray(job.jobType) ? job.jobType.join(', ') : job.jobType,
      minimumSalary: job.salary?.min || 0,
      maximumSalary: job.salary?.max || 0,
      applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : 'N/A',
      status: job.status,
      jobUrl: `/admin/jobs/${job._id}`,
      description: job.description || '',
      requirements: job.requirements || [],
      benefits: job.benefits || [],
      skills: job.skills || [],
      views: job.views || 0,
      employerInfo: job.employer ? {
        name: job.employer.companyName,
        email: job.employer.email,
        logo: job.employer.companyLogo
      } : null,
      postedDate: job.createdAt,
      lastUpdated: job.updatedAt
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      },
      message: "Jobs data fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching jobs data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching jobs data",
      error: error.message
    });
  }
});

// Admin Job Actions Endpoint - Update job status
router.patch("/admin/jobs/:jobId/status", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'active', 'paused', or 'closed'"
      });
    }

    // Update job status
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: updatedJob._id.toString(),
        status: updatedJob.status
      },
      message: `Job status updated to ${status} successfully`
    });

  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating job status",
      error: error.message
    });
  }
});

// Admin Delete Job Endpoint
router.delete("/admin/jobs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    // Find and delete the job
    const deletedJob = await Job.findByIdAndDelete(jobId);

    if (!deletedJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    // Also delete related applications
    await Application.deleteMany({ jobId: jobId });

    res.status(200).json({
      success: true,
      message: "Job deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting job",
      error: error.message
    });
  }
});

// Admin Quotes Endpoint - Get all quote requests
router.get("/admin/quotes", async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Build filter query
    const filterQuery = {};
    if (status) filterQuery.status = status;
    if (priority) filterQuery.priority = priority;
    if (search) {
      filterQuery.$or = [
        { service: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { 'contactPerson.name': { $regex: search, $options: 'i' } },
        { 'contactPerson.email': { $regex: search, $options: 'i' } },
        { requirements: { $regex: search, $options: 'i' } }
      ];
    }

    // Get quotes with pagination and sorting
    const [quotes, totalCount] = await Promise.all([
      QuoteRequest.find(filterQuery)
        .populate('employerId', 'companyName email phoneNumber')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      QuoteRequest.countDocuments(filterQuery)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: {
        quoteRequests: quotes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      },
      message: "Quote requests fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching quotes",
      error: error.message
    });
  }
});

// Admin Quote Actions Endpoint - Update quote status
router.put("/admin/quotes/:quoteId", async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { status, adminResponse, priority, note } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminResponse) {
      updateData.adminResponse = {
        ...adminResponse,
        respondedBy: 'admin',
        respondedAt: new Date()
      };
    }
    if (note) {
      updateData.$push = {
        notes: {
          note,
          addedBy: 'admin'
        }
      };
    }

    const quote = await QuoteRequest.findByIdAndUpdate(
      quoteId,
      updateData,
      { new: true }
    ).populate('employerId', 'companyName email phoneNumber');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote request not found"
      });
    }

    res.status(200).json({
      success: true,
      data: quote,
      message: "Quote request updated successfully"
    });

  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating quote",
      error: error.message
    });
  }
});

// Get individual jobseeker by ID
router.get("/admin/users/jobseeker/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const jobseeker = await FindrUser.findOne({ _id: id, role: "jobseeker" })
      .select('-password -__v');
    
    if (!jobseeker) {
      return res.status(404).json({
        success: false,
        message: "Jobseeker not found"
      });
    }
    
    res.json({
      success: true,
      data: jobseeker
    });
  } catch (error) {
    console.error("Error fetching jobseeker:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching jobseeker",
      error: error.message
    });
  }
});

// Get individual employer by ID
router.get("/admin/users/employer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const employer = await Employer.findOne({ _id: id })
      .select('-__v');
    
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found"
      });
    }
    
    res.json({
      success: true,
      data: employer
    });
  } catch (error) {
    console.error("Error fetching employer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching employer",
      error: error.message
    });
  }
});

module.exports = router;
