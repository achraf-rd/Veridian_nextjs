'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLES = [
  'ADAS Validation Engineer',
  'Senior Validation Engineer',
  'Validation Team Lead',
  'Safety Architect',
  'Systems Engineer',
] as const

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

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    organization: 'Capgemini Engineering',
    role: ROLES[0],
    password: '',
    confirm: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const inputClass =
    'w-full bg-vrd-bg border border-vrd-border rounded-lg px-3 py-2.5 text-sm text-vrd-text placeholder:text-vrd-text-dim focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all'

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
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-vrd-text mb-1">Create account</h1>
          <p className="text-sm text-vrd-text-muted">Join your Capgemini validation team</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Full name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-vrd-text-muted">Full name</label>
            <input
              type="text"
              autoComplete="name"
              placeholder="Achraf Rachid"
              value={form.name}
              onChange={set('name')}
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-vrd-text-muted">Work email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@capgemini.com"
              value={form.email}
              onChange={set('email')}
              className={inputClass}
            />
          </div>

          {/* Organization + Role (2-col) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-vrd-text-muted">Organization</label>
              <input
                type="text"
                value={form.organization}
                onChange={set('organization')}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-vrd-text-muted">Role</label>
              <select
                value={form.role}
                onChange={set('role')}
                className={cn(inputClass, 'cursor-pointer')}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-vrd-text-muted">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••••"
                value={form.password}
                onChange={set('password')}
                className={cn(inputClass, 'pr-10')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vrd-text-dim hover:text-vrd-text-muted transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-vrd-text-muted">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••••"
                value={form.confirm}
                onChange={set('confirm')}
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
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirm && form.confirm !== form.password && (
              <p className="text-[11px] text-danger">Passwords do not match</p>
            )}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 cursor-pointer group select-none pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-vrd-border accent-primary mt-0.5 flex-shrink-0"
            />
            <span className="text-xs text-vrd-text-muted group-hover:text-vrd-text transition-colors leading-relaxed">
              I agree to the{' '}
              <button type="button" className="text-primary-light hover:text-primary underline underline-offset-2">
                Terms of Service
              </button>{' '}
              and{' '}
              <button type="button" className="text-primary-light hover:text-primary underline underline-offset-2">
                Privacy Policy
              </button>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!agreed}
            className="w-full mt-1 bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20"
          >
            Create account
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-vrd-border text-center">
          <p className="text-xs text-vrd-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-8 text-[11px] text-vrd-text-dim text-center">
        © 2026 Capgemini Engineering · Veridian v1.0.0
      </p>
    </div>
  )
}
