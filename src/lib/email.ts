import nodemailer from 'nodemailer'

export interface AppointmentDetails {
  id: string
  fullName: string
  phoneNumber: string
  email?: string
  preferredDate?: string
  preferredTime?: string
  reasonForVisit: string
  specialRequirements?: string
  createdAt: string
}

function createTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set in environment variables')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

/**
 * Send a formatted appointment request email to the practice.
 */
export async function sendAppointmentEmail(appointment: AppointmentDetails): Promise<void> {
  const transporter = createTransporter()
  const toEmail = process.env.APPOINTMENT_EMAIL || 'dr.buleni@gmail.com'

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #1A2E35; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2B7A8E; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { background-color: #F8FBFC; padding: 24px; border: 1px solid #e0eaed; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 16px; }
    .label { font-weight: bold; color: #2B7A8E; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 16px; margin-top: 2px; }
    .action-box { background-color: #fff3cd; border: 1px solid #ffc107; padding: 16px; border-radius: 6px; margin-top: 20px; }
    .action-box h3 { margin: 0 0 8px; color: #856404; }
    .footer { margin-top: 24px; font-size: 12px; color: #666; }
    hr { border: none; border-top: 1px solid #dce8ec; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Appointment Request</h1>
      <p style="margin:4px 0 0; opacity:0.85;">Submitted via Smilez Dental website chatbot</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Patient Name</div>
        <div class="value">${appointment.fullName}</div>
      </div>
      <hr>
      <div class="field">
        <div class="label">Phone Number</div>
        <div class="value">${appointment.phoneNumber}</div>
      </div>
      ${appointment.email ? `
      <hr>
      <div class="field">
        <div class="label">Email Address</div>
        <div class="value">${appointment.email}</div>
      </div>` : ''}
      <hr>
      <div class="field">
        <div class="label">Preferred Date</div>
        <div class="value">${appointment.preferredDate || 'Not specified'}</div>
      </div>
      <hr>
      <div class="field">
        <div class="label">Preferred Time</div>
        <div class="value">${appointment.preferredTime || 'Not specified'}</div>
      </div>
      <hr>
      <div class="field">
        <div class="label">Reason for Visit</div>
        <div class="value">${appointment.reasonForVisit}</div>
      </div>
      ${appointment.specialRequirements ? `
      <hr>
      <div class="field">
        <div class="label">Special Requirements / Notes</div>
        <div class="value">${appointment.specialRequirements}</div>
      </div>` : ''}

      <div class="action-box">
        <h3>Action Required</h3>
        <p style="margin:0;">Please call <strong>${appointment.fullName}</strong> on <strong>${appointment.phoneNumber}</strong> to confirm or reschedule their appointment. The patient has been informed that the receptionist will contact them to confirm.</p>
      </div>

      <div class="footer">
        <p>Request ID: ${appointment.id}<br>
        Submitted: ${new Date(appointment.createdAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
        <p>This request was captured via the Smilez Dental Surgery website chatbot.</p>
      </div>
    </div>
  </div>
</body>
</html>
`

  const textBody = `
NEW APPOINTMENT REQUEST — Smilez Dental Surgery
================================================

Patient Name:    ${appointment.fullName}
Phone Number:    ${appointment.phoneNumber}
Email Address:   ${appointment.email || 'Not provided'}
Preferred Date:  ${appointment.preferredDate || 'Not specified'}
Preferred Time:  ${appointment.preferredTime || 'Not specified'}
Reason for Visit: ${appointment.reasonForVisit}
Special Requirements: ${appointment.specialRequirements || 'None'}

ACTION REQUIRED:
Please call ${appointment.fullName} on ${appointment.phoneNumber} to confirm or reschedule their appointment.

Request ID: ${appointment.id}
Submitted: ${new Date(appointment.createdAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
`

  await transporter.sendMail({
    from: `"Smilez Dental Chatbot" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `New Appointment Request - ${appointment.fullName}`,
    text: textBody,
    html: htmlBody,
  })
}

/**
 * Send a confirmation email to the patient (only if they provided an email address).
 */
export async function sendUserConfirmationEmail(appointment: AppointmentDetails): Promise<void> {
  if (!appointment.email) return
  const transporter = createTransporter()

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #1A2E35; line-height: 1.6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #A855F7; color: white; padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
    .content { background-color: #ffffff; padding: 28px 24px; border: 1px solid #e9d5ff; border-top: none; border-radius: 0 0 12px 12px; }
    .summary-box { background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .label { font-weight: bold; color: #7e22ce; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 15px; margin-top: 2px; color: #1A2E35; }
    .note-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin-top: 20px; }
    .emergency { background-color: #fef2f2; border: 1px solid #fecaca; padding: 14px; border-radius: 8px; margin-top: 16px; font-size: 13px; }
    .footer { margin-top: 24px; font-size: 12px; color: #888; text-align: center; }
    hr { border: none; border-top: 1px solid #f3e8ff; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Request Received 😊</h1>
      <p>Smilez Dental Surgery</p>
    </div>
    <div class="content">
      <p><strong>Hi ${appointment.fullName},</strong></p>
      <p>Thank you for reaching out! We have received your appointment request and our receptionist will call you on <strong>${appointment.phoneNumber}</strong> to confirm your booking.</p>
      <div class="summary-box">
        <div class="label">Your Name</div><div class="value">${appointment.fullName}</div>
        <hr>
        <div class="label">Contact Number</div><div class="value">${appointment.phoneNumber}</div>
        ${appointment.preferredDate ? `<hr><div class="label">Preferred Date</div><div class="value">${appointment.preferredDate}</div>` : ''}
        ${appointment.preferredTime ? `<hr><div class="label">Preferred Time</div><div class="value">${appointment.preferredTime}</div>` : ''}
        <hr>
        <div class="label">Reason for Visit</div><div class="value">${appointment.reasonForVisit}</div>
        ${appointment.specialRequirements ? `<hr><div class="label">Special Requirements</div><div class="value">${appointment.specialRequirements}</div>` : ''}
      </div>
      <div class="note-box">
        <strong>✅ What happens next?</strong><br>
        One of our friendly staff members will call you to confirm the date and time. Please keep your phone nearby!
      </div>
      <div class="emergency">
        🚨 <strong>Dental emergency?</strong> Please call us immediately on <strong>013 692 8249</strong> — don't wait for a callback.
      </div>
      <div class="footer">
        <p>Smilez Dental Surgery &middot; 013 692 8249 &middot; dr.buleni@gmail.com</p>
        <p style="color:#bbb;">Reference: ${appointment.id}</p>
      </div>
    </div>
  </div>
</body>
</html>`

  await transporter.sendMail({
    from: `"Smilez Dental Surgery" <${process.env.GMAIL_USER}>`,
    to: appointment.email,
    subject: `Your appointment request has been received, ${appointment.fullName.split(' ')[0]}! 😊`,
    html: htmlBody,
    text: `Hi ${appointment.fullName},\n\nThank you! We have received your appointment request and will call you on ${appointment.phoneNumber} to confirm.\n\nPreferred date: ${appointment.preferredDate || 'Not specified'}\nPreferred time: ${appointment.preferredTime || 'Not specified'}\nReason: ${appointment.reasonForVisit}\n\nFor dental emergencies, call us immediately on 013 692 8249.\n\nSmilez Dental Surgery`,
  })
}
