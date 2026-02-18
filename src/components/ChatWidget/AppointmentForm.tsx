'use client'

import { useState } from 'react'

interface AppointmentFormProps {
  onSubmit: (data: AppointmentData) => void
  onCancel: () => void
  apiUrl?: string
}

export interface AppointmentData {
  fullName: string
  phoneNumber: string
  email: string
  preferredDate: string
  preferredTime: string
  reasonForVisit: string
  specialRequirements: string
}

const TIME_OPTIONS = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
]

export default function AppointmentForm({ onSubmit, onCancel, apiUrl = '' }: AppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    reasonForVisit: '',
    specialRequirements: '',
  })
  const [errors, setErrors] = useState<Partial<AppointmentData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function validate(): boolean {
    const newErrors: Partial<AppointmentData> = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
    else if (formData.phoneNumber.replace(/\s/g, '').length < 10)
      newErrors.phoneNumber = 'Please enter a valid phone number'
    if (!formData.reasonForVisit.trim()) newErrors.reasonForVisit = 'Reason for visit is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError('')

    try {
      const baseUrl = apiUrl || window.location.origin
      const response = await fetch(`${baseUrl}/api/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim() || undefined,
          preferredDate: formData.preferredDate || undefined,
          preferredTime: formData.preferredTime || undefined,
          reasonForVisit: formData.reasonForVisit.trim(),
          specialRequirements: formData.specialRequirements.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setSubmitError(result.error || 'Failed to submit. Please try again.')
        return
      }

      onSubmit(formData)
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(field: keyof AppointmentData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Minimum date = today
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Book an Appointment</h3>
          <p className="text-xs text-gray-500 mt-0.5">Our receptionist will call to confirm</p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Back to chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="e.g. Sipho Dlamini"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              errors.fullName ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-0.5">{errors.fullName}</p>}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="e.g. 082 123 4567"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              errors.phoneNumber ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {errors.phoneNumber && <p className="text-xs text-red-500 mt-0.5">{errors.phoneNumber}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email Address <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="e.g. sipho@email.com"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {/* Preferred Date & Time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Date</label>
            <input
              type="date"
              value={formData.preferredDate}
              min={today}
              onChange={(e) => handleChange('preferredDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Time</label>
            <select
              value={formData.preferredTime}
              onChange={(e) => handleChange('preferredTime', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            >
              <option value="">Any time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reason for Visit */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Reason for Visit <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reasonForVisit}
            onChange={(e) => handleChange('reasonForVisit', e.target.value)}
            placeholder="e.g. Routine check-up, tooth pain, consultation..."
            rows={2}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none ${
              errors.reasonForVisit ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {errors.reasonForVisit && (
            <p className="text-xs text-red-500 mt-0.5">{errors.reasonForVisit}</p>
          )}
        </div>

        {/* Special Requirements */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Special Requirements <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={formData.specialRequirements}
            onChange={(e) => handleChange('specialRequirements', e.target.value)}
            placeholder="e.g. dental anxiety, mobility needs, interpreter needed..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-xs text-red-600">{submitError}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1 pb-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Chat
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2.5 text-sm text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
            style={{ background: '#A855F7' }}
          >
            {submitting ? 'Submitting...' : 'Request Appointment'}
          </button>
        </div>
      </form>
    </div>
  )
}
