import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendAppointmentEmail, sendUserConfirmationEmail } from '@/lib/email'

export const runtime = 'nodejs'

interface AppointmentBody {
  fullName: string
  phoneNumber: string
  email?: string
  preferredDate?: string
  preferredTime?: string
  reasonForVisit: string
  specialRequirements?: string
  sessionId?: string
}

export async function POST(request: NextRequest) {
  let body: AppointmentBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate required fields
  const { fullName, phoneNumber, reasonForVisit } = body

  if (!fullName?.trim()) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  }
  if (!phoneNumber?.trim()) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  }
  if (!reasonForVisit?.trim()) {
    return NextResponse.json({ error: 'Reason for visit is required' }, { status: 400 })
  }

  // Basic phone number format check (SA numbers)
  const phoneClean = phoneNumber.replace(/\s/g, '')
  if (phoneClean.length < 10) {
    return NextResponse.json({ error: 'Please provide a valid phone number' }, { status: 400 })
  }

  try {
    const supabase = supabaseAdmin()

    // Insert appointment request
    const { data: appointment, error: insertError } = await supabase
      .from('appointment_requests')
      .insert({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        email: body.email?.trim() || null,
        preferred_date: body.preferredDate?.trim() || null,
        preferred_time: body.preferredTime?.trim() || null,
        reason_for_visit: reasonForVisit.trim(),
        special_requirements: body.specialRequirements?.trim() || null,
        session_id: body.sessionId || null,
        status: 'pending',
        email_sent: false,
      })
      .select()
      .single()

    if (insertError || !appointment) {
      console.error('Appointment insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save appointment request. Please try again.' },
        { status: 500 }
      )
    }

    // Send email notification (non-blocking — don't fail if email fails)
    let emailSent = false
    try {
      await sendAppointmentEmail({
        id: appointment.id,
        fullName: appointment.full_name,
        phoneNumber: appointment.phone_number,
        email: appointment.email,
        preferredDate: appointment.preferred_date,
        preferredTime: appointment.preferred_time,
        reasonForVisit: appointment.reason_for_visit,
        specialRequirements: appointment.special_requirements,
        createdAt: appointment.created_at,
      })
      emailSent = true

      // Send confirmation email to patient (if they provided an email)
      if (appointment.email) {
        await sendUserConfirmationEmail({
          id: appointment.id,
          fullName: appointment.full_name,
          phoneNumber: appointment.phone_number,
          email: appointment.email,
          preferredDate: appointment.preferred_date,
          preferredTime: appointment.preferred_time,
          reasonForVisit: appointment.reason_for_visit,
          specialRequirements: appointment.special_requirements,
          createdAt: appointment.created_at,
        }).catch((e) => console.error('User confirmation email error:', e))
      }

      // Update email_sent flag
      await supabase
        .from('appointment_requests')
        .update({ email_sent: true })
        .eq('id', appointment.id)
    } catch (emailError) {
      console.error('Email send error (appointment saved):', emailError)
      // Appointment is already saved — email failure is non-fatal
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      emailSent,
      message: emailSent
        ? 'Your appointment request has been received. Our receptionist will call you shortly to confirm.'
        : 'Your appointment request has been saved. Please call us on 013 692 8249 to confirm.',
    })
  } catch (error) {
    console.error('Appointment API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again or call us on 013 692 8249.' },
      { status: 500 }
    )
  }
}
