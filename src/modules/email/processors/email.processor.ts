import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('email')
@Injectable()
export class EmailProcessor {
  constructor(private mailerService: MailerService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<{
    to: string;
    subject: string;
    text: string;
    html?: string;
    cc?: string[];
    bcc?: string[];
  }>) {
    const { to, subject, text, html, cc, bcc } = job.data;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        text,
        html,
        cc,
        bcc,
      });

      console.log(`Email sent successfully to ${to}`);
      return { success: true, to, subject };
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  @Process('send-invitation')
  async handleSendInvitation(job: Job<{
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    invitationToken: string;
    customMessage?: string;
  }>) {
    const { email, firstName, lastName, role, invitationToken, customMessage } = job.data;

    try {
      const invitationUrl = `${process.env.FRONTEND_URL || 'https://4ami-mu.vercel.app'}/customer_signup?token=${invitationToken}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to 4AMI Platform</h2>
          <p>Hello ${firstName} ${lastName},</p>
          <p>You have been invited to join the 4AMI Platform as a ${role}.</p>
          ${customMessage ? `<p>${customMessage}</p>` : ''}
          <p>Click the link below to complete your registration:</p>
          <a href="${invitationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Registration</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${invitationUrl}</p>
          <p>Best regards,<br>The 4AMI Team</p>
        </div>
      `;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Invitation to Join 4AMI Platform',
        html,
      });

      console.log(`Invitation email sent successfully to ${email}`);
      return { success: true, email, role };
    } catch (error) {
      console.error(`Failed to send invitation email to ${email}:`, error);
      throw error;
    }
  }

  @Process('send-password-reset')
  async handleSendPasswordReset(job: Job<{
    email: string;
    resetToken: string;
  }>) {
    const { email, resetToken } = job.data;

    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password for your 4AMI Platform account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The 4AMI Team</p>
        </div>
      `;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Request - 4AMI Platform',
        html,
      });

      console.log(`Password reset email sent successfully to ${email}`);
      return { success: true, email };
    } catch (error) {
      console.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  @Process('send-email-verification')
  async handleSendEmailVerification(job: Job<{
    email: string;
    verificationToken: string;
  }>) {
    const { email, verificationToken } = job.data;

    try {
      const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/v1/auth/verify-email/${verificationToken}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Thank you for registering with 4AMI Platform!</p>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>Best regards,<br>The 4AMI Team</p>
        </div>
      `;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email - 4AMI Platform',
        html,
      });

      console.log(`Email verification sent successfully to ${email}`);
      return { success: true, email };
    } catch (error) {
      console.error(`Failed to send email verification to ${email}:`, error);
      throw error;
    }
  }
}
