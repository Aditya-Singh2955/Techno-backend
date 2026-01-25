// Legacy emailService.js - Re-exports all email functions from the modular emails directory
// This file maintains backward compatibility with existing imports

// Import all email functions from the new modular structure
const emailFunctions = require('./emails');

// Re-export all functions to maintain backward compatibility
module.exports = {
  ...emailFunctions,
  
  // Legacy function names (if any controllers use different names)
  // Add any legacy function name mappings here if needed
};

// Also export individual functions for convenience
module.exports.sendPasswordResetEmail = emailFunctions.sendPasswordResetEmail;
module.exports.sendWelcomeEmail = emailFunctions.sendWelcomeEmail;
module.exports.sendApplicationConfirmationEmail = emailFunctions.sendApplicationConfirmationEmail;
module.exports.sendApplicationStatusUpdateEmail = emailFunctions.sendApplicationStatusUpdateEmail;
module.exports.sendJobPostedEmail = emailFunctions.sendJobPostedEmail;
module.exports.sendNewApplicationNotificationEmail = emailFunctions.sendNewApplicationNotificationEmail;
module.exports.sendJobNotificationEmail = emailFunctions.sendJobNotificationEmail;
module.exports.sendRMServicePurchaseEmail = emailFunctions.sendRMServicePurchaseEmail;
module.exports.sendQuoteRequestConfirmationEmail = emailFunctions.sendQuoteRequestConfirmationEmail;
module.exports.sendQuoteRequestAdminNotificationEmail = emailFunctions.sendQuoteRequestAdminNotificationEmail;
module.exports.sendOTPEmail = emailFunctions.sendOTPEmail;