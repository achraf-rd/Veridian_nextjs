'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        router.push('/')
      }
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
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-vrd-text mb-1">Sign in</h1>
          <p className="text-sm text-vrd-text-muted">Use your credentials to continue</p>
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
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={loading}
              required
              className="w-full bg-vrd-bg border border-vrd-border rounded-lg px-3 py-2.5 text-sm text-vrd-text placeholder:text-vrd-text-dim focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-vrd-text-muted">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
                required
                className="w-full bg-vrd-bg border border-vrd-border rounded-lg px-3 py-2.5 pr-10 text-sm text-vrd-text placeholder:text-vrd-text-dim focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vrd-text-dim hover:text-vrd-text-muted transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
                className="w-3.5 h-3.5 rounded border-vrd-border accent-primary disabled:opacity-50"
              />
              <span className="text-xs text-vrd-text-muted group-hover:text-vrd-text transition-colors">
                Remember me
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary-light hover:text-primary transition-colors disabled:opacity-50 inline-block"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ChevronRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-vrd-border text-center">
          <p className="text-xs text-vrd-text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-light hover:text-primary font-medium transition-colors">
              Create one →
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
