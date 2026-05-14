'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function PasswordStrength({ password }: { password: string }) {
  const len = password.length
  const score = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-300',
            score === 0 && 'bg-vrd-border',
            score === 1 && i === 1 && 'bg-danger',
            score === 2 && i <= 2 && 'bg-warning',
            score === 3 && 'bg-success',
            ((score === 1 && i > 1) || (score === 2 && i > 2)) && 'bg-vrd-border',
          )}
        />
      ))}
      <span className="text-[10px] text-vrd-text-dim w-14 text-right">
        {score === 0 ? '' : score === 1 ? 'Weak' : score === 2 ? 'Fair' : 'Strong'}
      </span>
    </div>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const token = (params?.token || '') as string

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    password: '',
    confirm: '',
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }

    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-vrd-bg border border-vrd-border rounded-lg px-3 py-2.5 text-sm text-vrd-text placeholder:text-vrd-text-dim focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50'

  return (
    <div className="min-h-screen bg-vrd-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center select-none">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
            <Image src="/Veridian-logo.png" alt="Veridian" width={30} height={30} className="object-contain rounded-lg" />
          </div>
          <span className="text-2xl font-semibold text-vrd-text tracking-tight">Veridian</span>
        </div>
        <p className="text-sm text-vrd-text-muted">ADAS Validation Platform · Capgemini Engineering</p>
      </div>

      <div className="w-full max-w-sm bg-vrd-card border border-vrd-border rounded-2xl p-8 shadow-2xl">
        {!success ? (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-vrd-text mb-1">Create new password</h1>
              <p className="text-sm text-vrd-text-muted">Enter a new password for your account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-vrd-text-muted">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    disabled={loading}
                    required
                    className={cn(inputClass, 'pr-10')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-vrd-text-dim hover:text-vrd-text-muted transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-vrd-text-muted">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    disabled={loading}
                    required
                    className={cn(
                      inputClass,
                      'pr-10',
                      form.confirm && form.confirm !== form.password && 'border-danger/50 focus:border-danger/60',
                    )}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-vrd-text-dim hover:text-vrd-text-muted transition-colors"
                    disabled={loading}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-[11px] text-danger">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset password'}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-vrd-text mb-2">Password reset successful</h1>
            <p className="text-sm text-vrd-text-muted">Your password has been updated. Redirecting to login...</p>
          </div>
        )}
      </div>

      <p className="mt-8 text-[11px] text-vrd-text-dim text-center">
        © 2026 Capgemini Engineering · Veridian v1.0.0
      </p>
    </div>
  )
}
