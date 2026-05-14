import nodemailer from 'nodemailer'

// Create transporter - using environment variables for SMTP config
// Fallback to test account if env vars not set (for development)
let transporter: nodemailer.Transporter | null = null

async function getTransporter() {
  if (transporter) return transporter

  // If environment variables are set, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    // Use Ethereal Email for testing (create a test account)
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    console.log('Using Ethereal test email account for password resets')
  }

  return transporter
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName?: string
) {
  try {
    const transport = await getTransporter()

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Veridian" <noreply@veridian.local>',
      to: email,
      subject: 'Reset your Veridian password',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0284c7; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Veridian</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px;">ADAS Validation Platform</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #09090b; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #64748b; line-height: 1.6;">
              ${userName ? `Hi ${userName},` : 'Hi,'}
            </p>
            
            <p style="color: #64748b; line-height: 1.6;">
              We received a request to reset the password for your Veridian account. 
              If you didn't make this request, you can safely ignore this email.
            </p>
            
            <p style="color: #64748b; line-height: 1.6;">
              To reset your password, click the link below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
              Or copy and paste this link in your browser:
            </p>
            <p style="color: #0284c7; font-size: 12px; word-break: break-all; margin: 10px 0;">
              ${resetUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
              This password reset link will expire in 1 hour.
            </p>
            
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-bottom: 0;">
              © 2026 Capgemini Engineering · Veridian
            </p>
          </div>
        </div>
      `,
      text: `
Password Reset Request

${userName ? `Hi ${userName},` : 'Hi,'}

We received a request to reset the password for your Veridian account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetUrl}

This link will expire in 1 hour.

© 2026 Capgemini Engineering · Veridian
      `,
    }

    const info = await transport.sendMail(mailOptions)
    console.log('Password reset email sent:', info.messageId)

    // For Ethereal test account, log the preview URL
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
    }

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}
