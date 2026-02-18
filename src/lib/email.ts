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
