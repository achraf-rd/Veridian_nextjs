import nodemailer from 'nodemailer'

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'Email not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in your environment.'
    )
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT ?? '587'),
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    pool: true,
    maxConnections: 5,
    rateDelta: 20000,
    rateLimit: 5,
  })
}

let _transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) _transporter = createTransporter()
  return _transporter
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName?: string
) {
  const transport = getTransporter()

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? '"Veridian" <noreply@veridian.app>',
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
            This link expires in 1 hour. If you didn't request a reset, no action is needed.
          </p>

          <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-bottom: 0;">
            © 2026 Capgemini Engineering · Veridian
          </p>
        </div>
      </div>
    `,
    text: `Password Reset Request\n\n${userName ? `Hi ${userName},` : 'Hi,'}\n\nReset your Veridian password here:\n${resetUrl}\n\nThis link expires in 1 hour.\n\n© 2026 Capgemini Engineering · Veridian`,
  })
}
