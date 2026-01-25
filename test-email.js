const { testEmailConnection, sendPasswordResetEmail } = require('./services/emailService');
require('dotenv').config();

async function testEmail() {
  console.log('=== Email Configuration Test ===');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***CONFIGURED***' : 'NOT SET');
  console.log('');

  // Test connection
  console.log('1. Testing SMTP connection...');
  const connectionTest = await testEmailConnection();
  console.log('Connection test result:', connectionTest);
  console.log('');

  if (connectionTest.success) {
    console.log('2. Testing password reset email...');
    try {
      const testResult = await sendPasswordResetEmail(
        process.env.EMAIL_USER, // Send to yourself for testing
        'test-token-12345',
        'Test User'
      );
      console.log('Test email result:', testResult);
    } catch (error) {
      console.error('Test email failed:', error);
    }
  } else {
    console.log('Skipping email test due to connection failure');
  }
}

testEmail().catch(console.error);