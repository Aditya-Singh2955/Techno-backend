// Email service exports - one function per file for better performance and memory management

const sendPasswordResetEmail = require('./sendPasswordResetEmail');
const sendWelcomeEmail = require('./sendWelcomeEmail');
const sendApplicationConfirmationEmail = require('./sendApplicationConfirmationEmail');
const sendJobNotificationEmail = require('./sendJobNotificationEmail');
const sendOTPEmail = require('./sendOTPEmail');
const sendApplicationStatusUpdateEmail = require('./sendApplicationStatusUpdateEmail');
const sendJobPostedEmail = require('./sendJobPostedEmail');
const sendNewApplicationNotificationEmail = require('./sendNewApplicationNotificationEmail');
const sendRMServicePurchaseEmail = require('./sendRMServicePurchaseEmail');
const sendQuoteRequestConfirmationEmail = require('./sendQuoteRequestConfirmationEmail');
const sendQuoteRequestAdminNotificationEmail = require('./sendQuoteRequestAdminNotificationEmail');

// Export all email functions
module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendApplicationConfirmationEmail,
  sendJobNotificationEmail,
  sendOTPEmail,
  sendApplicationStatusUpdateEmail,
  sendJobPostedEmail,
  sendNewApplicationNotificationEmail,
  sendRMServicePurchaseEmail,
  sendQuoteRequestConfirmationEmail,
  sendQuoteRequestAdminNotificationEmail,
};