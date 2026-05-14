'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to process request')
        return
      }

      setSubmitted(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vrd-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Branding */}
      <div className="mb-8 text-center select-none">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
            <Image src="/Veridian-logo.png" alt="Veridian" width={30} height={30} className="object-contain rounded-lg" />
          </div>
          <span className="text-2xl font-semibold text-vrd-text tracking-tight">Veridian</span>
        </div>
        <p className="text-sm text-vrd-text-muted">ADAS Validation Platform · Capgemini Engineering</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-vrd-card border border-vrd-border rounded-2xl p-8 shadow-2xl">
        {!submitted ? (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-vrd-text mb-1">Reset password</h1>
              <p className="text-sm text-vrd-text-muted">Enter your email to receive a reset link</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-vrd-text-muted">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-vrd-bg border border-vrd-border rounded-lg px-3 py-2.5 text-sm text-vrd-text placeholder:text-vrd-text-dim focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send reset link'}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-vrd-border text-center">
              <button
                onClick={() => router.push('/login')}
                className="flex items-center justify-center gap-1.5 text-xs text-primary-light hover:text-primary font-medium transition-colors mx-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-vrd-text mb-1 text-center">Check your email</h1>
              <p className="text-sm text-vrd-text-muted text-center">We've sent a password reset link to <strong>{email}</strong></p>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mb-6">
              <p className="text-sm text-vrd-text-muted">
                The link will expire in 1 hour. Check your spam folder if you don't see it.
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-xs text-primary-light hover:text-primary font-medium transition-colors"
              >
                Back to sign in
              </button>
            </div>
          </>
        )}
      </div>

      <p className="mt-8 text-[11px] text-vrd-text-dim text-center">
        © 2026 Capgemini Engineering · Veridian v1.0.0
      </p>
    </div>
  )
}
