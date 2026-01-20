import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { EmailService } from './email.service';
import { log } from '../utils/logger';
import { 
  NotFoundError, 
  ValidationError, 
  ConflictError 
} from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export interface EmailVerificationToken {
  id: string;
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export class EmailVerificationService {
  /**
   * Generate and send email verification token
   */
  static async sendVerificationEmail(userId: string, email?: string): Promise<{ message: string }> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Use provided email or user's current email
      const targetEmail = email || user.email;

      // Check if email is already verified (for current email)
      if (!email && user.isEmailVerified) {
        throw new ConflictError('Email is already verified');
      }

      // Check if email is already in use by another user (for email changes)
      if (email && email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: targetEmail.toLowerCase() },
        });

        if (existingUser) {
          throw new ConflictError('Email is already in use by another account');
        }
      }

      // Check for recent verification requests (rate limiting)
      const recentVerification = await prisma.$queryRaw<any[]>`
        SELECT id FROM email_verification_tokens 
        WHERE userId = ${userId} 
        AND email = ${targetEmail.toLowerCase()}
        AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        AND used = false
        LIMIT 1
      `;

      if (recentVerification.length > 0) {
        return { message: 'Verification email was recently sent. Please check your inbox or wait a few minutes before requesting again.' };
      }

      // Generate secure verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token in database
      await prisma.$executeRaw`
        INSERT INTO email_verification_tokens (id, token, userId, email, expiresAt, used, createdAt, updatedAt)
        VALUES (${crypto.randomUUID()}, ${hashedToken}, ${userId}, ${targetEmail.toLowerCase()}, ${expiresAt}, false, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        token = VALUES(token),
        expiresAt = VALUES(expiresAt),
        used = false,
        updatedAt = NOW()
      `;

      // Send verification email
      if (email && email !== user.email) {
        // Email change verification
        await EmailService.sendEmail({
          to: targetEmail,
          subject: 'Verify Your New Email Address',
          html: this.getEmailChangeVerificationTemplate(user.name || 'User', verificationToken),
          text: `Hello ${user.name || 'User'},\n\nPlease verify your new email address by visiting: ${process.env.CLIENT_URL}/verify-email?token=${verificationToken}\n\nThis link expires in 24 hours.\n\nBest regards,\nThe EthioAI Tourism Team`
        });
      } else {
        // Initial email verification
        await EmailService.sendEmailVerification(targetEmail, user.name || 'User', verificationToken);
      }

      log.auth('Email verification sent', userId, { 
        email: targetEmail, 
        isEmailChange: email !== user.email,
        expiresAt 
      });

      return { message: 'Verification email sent successfully. Please check your inbox.' };
    } catch (error) {
      log.error('Failed to send verification email:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string, ip?: string, userAgent?: string): Promise<{ message: string; user: any }> {
    try {
      // Hash the provided token to match stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid verification token
      const verificationRecord = await prisma.$queryRaw<any[]>`
        SELECT evt.*, u.id as userId, u.email as currentEmail, u.name, u.isEmailVerified
        FROM email_verification_tokens evt
        JOIN users u ON evt.userId = u.id
        WHERE evt.token = ${hashedToken}
        AND evt.expiresAt > NOW()
        AND evt.used = false
        LIMIT 1
      `;

      if (verificationRecord.length === 0) {
        log.security('Invalid or expired email verification token used', undefined, userAgent, { 
          token: token.substring(0, 8) + '...', 
          ip 
        });
        throw new ValidationError('Invalid or expired verification token');
      }

      const verification = verificationRecord[0];
      const isEmailChange = verification.email !== verification.currentEmail;

      // Update user and mark token as used
      const updatedUser = await prisma.$transaction(async (tx) => {
        // Update user email and verification status
        const user = await tx.user.update({
          where: { id: verification.userId },
          data: {
            email: verification.email,
            isEmailVerified: true,
            updatedAt: new Date(),
          },
        });

        // Mark verification token as used
        await tx.$executeRaw`
          UPDATE email_verification_tokens 
          SET used = true, updatedAt = NOW()
          WHERE token = ${hashedToken}
        `;

        // Clean up old verification tokens for this user
        await tx.$executeRaw`
          DELETE FROM email_verification_tokens 
          WHERE userId = ${verification.userId} 
          AND (used = true OR expiresAt < NOW())
        `;

        return user;
      });

      log.auth('Email verification completed', verification.userId, { 
        email: verification.email, 
        isEmailChange,
        ip, 
        userAgent 
      });

      // Send confirmation email
      try {
        if (isEmailChange) {
          await EmailService.sendEmail({
            to: verification.email,
            subject: 'Email Address Updated Successfully',
            html: this.getEmailChangeSuccessTemplate(verification.name || 'User'),
            text: `Hello ${verification.name || 'User'},\n\nYour email address has been successfully updated and verified.\n\nBest regards,\nThe EthioAI Tourism Team`
          });
        } else {
          await EmailService.sendEmail({
            to: verification.email,
            subject: 'Email Verified Successfully',
            html: this.getEmailVerificationSuccessTemplate(verification.name || 'User'),
            text: `Hello ${verification.name || 'User'},\n\nYour email address has been successfully verified. Welcome to EthioAI Tourism Platform!\n\nBest regards,\nThe EthioAI Tourism Team`
          });
        }
      } catch (emailError) {
        log.error('Failed to send email verification confirmation:', emailError);
        // Don't fail the verification if email fails
      }

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      
      return { 
        message: isEmailChange 
          ? 'Email address updated and verified successfully.' 
          : 'Email verified successfully. Welcome to EthioAI Tourism Platform!',
        user: userWithoutPassword
      };
    } catch (error) {
      log.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Verify token validity (without using it)
   */
  static async verifyToken(token: string): Promise<{ valid: boolean; email?: string; isEmailChange?: boolean }> {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const verificationRecord = await prisma.$queryRaw<any[]>`
        SELECT evt.email, u.email as currentEmail
        FROM email_verification_tokens evt
        JOIN users u ON evt.userId = u.id
        WHERE evt.token = ${hashedToken}
        AND evt.expiresAt > NOW()
        AND evt.used = false
        LIMIT 1
      `;

      if (verificationRecord.length === 0) {
        return { valid: false };
      }

      const verification = verificationRecord[0];
      const isEmailChange = verification.email !== verification.currentEmail;

      return { 
        valid: true, 
        email: verification.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially hide email
        isEmailChange
      };
    } catch (error) {
      log.error('Email verification token check failed:', error);
      return { valid: false };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new ConflictError('Email is already verified');
    }

    return this.sendVerificationEmail(userId);
  }

  /**
   * Clean up expired verification tokens (should be run periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.$executeRaw`
        DELETE FROM email_verification_tokens 
        WHERE expiresAt < NOW() OR used = true
      `;

      log.info('Cleaned up expired email verification tokens', { count: result });
      return Number(result);
    } catch (error) {
      log.error('Failed to cleanup expired verification tokens:', error);
      return 0;
    }
  }

  /**
   * Get email change verification template
   */
  private static getEmailChangeVerificationTemplate(name: string, token: string): string {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your New Email Address</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3498db; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Verify New Email Address</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>You've requested to change your email address on EthioAI Tourism Platform. Please verify your new email address to complete this change.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify New Email Address</a>
            </div>
            
            <div class="warning">
              <strong>🔒 Security Notice:</strong>
              <ul>
                <li>This verification link will expire in 24 hours</li>
                <li>If you didn't request this change, please ignore this email</li>
                <li>Your current email address will remain active until verification</li>
              </ul>
            </div>
            
            <p>If you have any questions, please contact our support team at <a href="mailto:support@ethioai.com">support@ethioai.com</a>.</p>
            
            <p>Best regards,<br>The EthioAI Tourism Team</p>
          </div>
          <div class="footer">
            <p>© 2024 EthioAI Tourism Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get email change success template
   */
  private static getEmailChangeSuccessTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Address Updated Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #27ae60; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Email Updated Successfully</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Your email address has been successfully updated and verified on EthioAI Tourism Platform.</p>
            
            <p>This email address will now be used for:</p>
            <ul>
              <li>Account notifications and updates</li>
              <li>Booking confirmations and reminders</li>
              <li>Password reset requests</li>
              <li>Important security alerts</li>
            </ul>
            
            <p>If you didn't make this change, please contact our support team immediately at <a href="mailto:support@ethioai.com">support@ethioai.com</a>.</p>
            
            <p>Best regards,<br>The EthioAI Tourism Team</p>
          </div>
          <div class="footer">
            <p>© 2024 EthioAI Tourism Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get email verification success template
   */
  private static getEmailVerificationSuccessTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #27ae60; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to EthioAI Tourism!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Congratulations! Your email address has been successfully verified. You now have full access to all EthioAI Tourism Platform features.</p>
            
            <div class="features">
              <h3>🌟 What you can do now:</h3>
              <ul>
                <li>🏛️ Browse and book amazing Ethiopian tours</li>
                <li>🤖 Get personalized recommendations from our AI assistant</li>
                <li>🛍️ Shop authentic Ethiopian products in our marketplace</li>
                <li>📱 Receive important booking and travel notifications</li>
                <li>💬 Connect with local guides and fellow travelers</li>
                <li>📊 Access your personalized travel dashboard</li>
              </ul>
            </div>
            
            <p>Ready to start your Ethiopian adventure? <a href="${process.env.CLIENT_URL}/tours">Explore our tours</a> or <a href="${process.env.CLIENT_URL}/chat">chat with our AI assistant</a> for personalized recommendations!</p>
            
            <p>Welcome aboard!<br>The EthioAI Tourism Team</p>
          </div>
          <div class="footer">
            <p>© 2024 EthioAI Tourism Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Create the email_verification_tokens table if it doesn't exist
export async function createEmailVerificationTable(): Promise<void> {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id VARCHAR(36) PRIMARY KEY,
        token VARCHAR(64) NOT NULL UNIQUE,
        userId VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        expiresAt DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_user_id (userId),
        INDEX idx_email (email),
        INDEX idx_expires_at (expiresAt),
        UNIQUE KEY unique_user_email (userId, email),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    log.info('Email verification tokens table created/verified');
  } catch (error) {
    log.error('Failed to create email verification tokens table:', error);
  }
}