const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Create transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production email service (SendGrid, AWS SES, etc.)
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'sendgrid',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS || process.env.SENDGRID_API_KEY
          }
        });
      } else {
        // Development - use Gmail or create test account
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      }

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.warn('⚠️ Email service initialization failed:', error.message);
      console.log('📧 Email functionality will be disabled. Set up email credentials in .env to enable.');
      
      // Create a mock transporter for development
      this.transporter = {
        sendMail: async (options) => {
          console.log('📧 Mock email sent:', {
            to: options.to,
            subject: options.subject,
            text: options.text?.substring(0, 100) + '...'
          });
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }

  async sendEmail(options) {
    if (!this.transporter) {
      console.warn('⚠️ Email service not initialized. Cannot send email.');
      return;
    }

    try {
      const info = await this.transporter.sendMail(options);
      console.log('✅ Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      throw error;
    }
  }
}

module.exports = new EmailService();
