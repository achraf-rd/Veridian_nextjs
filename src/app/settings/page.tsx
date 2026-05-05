'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  SlidersHorizontal,
  Camera,
  Shield,
  Monitor,
  Moon,
  Sun,
  ChevronRight,
  Key,
  Smartphone,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Shared field styles ──────────────────────────────────────────────────────

const input =
  'w-full bg-vrd-bg border border-vrd-border rounded-lg px-3 py-2 text-sm text-vrd-text placeholder:text-vrd-text-dim focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

const label = 'block text-xs font-medium text-vrd-text-muted mb-1.5'

// ─── Nav sections ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'security',      label: 'Security',      icon: Lock },
  { id: 'preferences',   label: 'Preferences',   icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const
type SectionId = (typeof SECTIONS)[number]['id']

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors flex-shrink-0',
        checked ? 'bg-primary' : 'bg-vrd-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-4',
        )}
      />
    </button>
  )
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-vrd-text-dim mb-4">
      {children}
    </h3>
  )
}

function Divider() {
  return <div className="border-t border-vrd-border my-8" />
}

// ─── Profile section ─────────────────────────────────────────────────────────

function ProfileSection({ userEmail }: { userEmail?: string }) {
  const [form, setForm] = useState({
    name: '',
    title: '',
    organization: '',
    bio: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (res.ok) {
          const user = await res.json()
          setForm({
            name: user.name || '',
            title: user.role || '',
            organization: user.organization || '',
            bio: user.bio || '',
          })
        }
      } catch (err) {
        console.error('Failed to load user:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          role: form.title,
          organization: form.organization,
          bio: form.bio,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-vrd-text-muted">Loading...</div>

  return (
    <div>
      <SectionTitle>Profile information</SectionTitle>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
            <span className="text-xl font-semibold text-white select-none">
              {(form.name || 'U')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </span>
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-vrd-card border border-vrd-border flex items-center justify-center hover:bg-vrd-card-hover transition-colors">
            <Camera className="w-3 h-3 text-vrd-text-muted" />
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-vrd-text">{form.name || 'User'}</p>
          <p className="text-xs text-vrd-text-muted">{form.title}</p>
          <button className="text-xs text-primary-light hover:text-primary transition-colors mt-1">
            Change photo
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Full name</label>
            <input
              className={input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={saving}
            />
          </div>
          <div>
            <label className={label}>Job title</label>
            <input
              className={input}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className={label}>Work email</label>
          <input
            type="email"
            className={cn(input, 'opacity-60 cursor-not-allowed')}
            value={userEmail || ''}
            disabled
          />
          <p className="text-[11px] text-vrd-text-dim mt-1">
            Email is managed by your account and cannot be changed here.
          </p>
        </div>

        <div>
          <label className={label}>Organization</label>
          <input
            className={input}
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
            disabled={saving}
          />
        </div>

        <div>
          <label className={label}>Bio</label>
          <textarea
            rows={3}
            className={cn(input, 'resize-none')}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            disabled={saving}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-primary/20"
        >
          {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
        </button>
        <button className="px-4 py-2 text-sm text-vrd-text-muted hover:text-vrd-text transition-colors" disabled={saving}>
          Cancel
        </button>
      </div>

      <Divider />

      {/* Danger zone */}
      <SectionTitle>Danger zone</SectionTitle>
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-vrd-text">Delete account</p>
          <p className="text-xs text-vrd-text-muted mt-0.5">
            Permanently delete your account and all associated data.
          </p>
        </div>
        <button className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 rounded-lg hover:bg-danger/10 transition-colors">
          Delete account
        </button>
      </div>
    </div>
  )
}

// ─── Security section ─────────────────────────────────────────────────────────

function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)

  const handleCopyKey = () => {
    setApiKeyCopied(true)
    setTimeout(() => setApiKeyCopied(false), 2000)
  }

  return (
    <div>
      <SectionTitle>Change password</SectionTitle>
      <div className="space-y-4 max-w-sm">
        <div>
          <label className={label}>Current password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              className={cn(input, 'pr-10')}
              placeholder="••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vrd-text-dim hover:text-vrd-text-muted"
            >
              {showCurrent
                ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>
        <div>
          <label className={label}>New password</label>
          <input type="password" className={input} placeholder="••••••••••" />
        </div>
        <div>
          <label className={label}>Confirm new password</label>
          <input type="password" className={input} placeholder="••••••••••" />
        </div>
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-primary/20">
          Update password
        </button>
      </div>

      <Divider />

      {/* 2FA */}
      <SectionTitle>Two-factor authentication</SectionTitle>
      <div className="flex items-start justify-between gap-4 max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-vrd-card-hover flex items-center justify-center flex-shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4 text-vrd-text-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-vrd-text">Authenticator app</p>
            <p className="text-xs text-vrd-text-muted mt-0.5">
              Use Google Authenticator or similar to generate codes.
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-vrd-card-hover text-vrd-text-dim border border-vrd-border">
          Coming soon
        </span>
      </div>

      <Divider />

      {/* API key */}
      <SectionTitle>API access</SectionTitle>
      <div className="max-w-md space-y-3">
        <p className="text-xs text-vrd-text-muted">
          Use this key to authenticate programmatic access to the Veridian API.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-vrd-bg border border-vrd-border rounded-lg px-3 py-2 font-mono text-xs text-vrd-text-muted select-all">
            vrd_sk_••••••••••••••••••••••••••••••••
          </div>
          <button
            onClick={handleCopyKey}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-vrd-text-muted hover:text-vrd-text border border-vrd-border rounded-lg hover:bg-vrd-card-hover transition-colors"
          >
            {apiKeyCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {apiKeyCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs text-primary-light hover:text-primary transition-colors flex items-center gap-1">
            <Key className="w-3 h-3" />
            Regenerate key
          </button>
          <span className="text-vrd-text-dim text-xs">·</span>
          <span className="text-xs text-vrd-text-dim">Last used 2 days ago</span>
        </div>
      </div>

      <Divider />

      {/* Sessions */}
      <SectionTitle>Active sessions</SectionTitle>
      <div className="space-y-2 max-w-md">
        {[
          { device: 'Chrome on Windows 11', location: 'Paris, FR', current: true, time: 'Now' },
          { device: 'Firefox on macOS', location: 'Lyon, FR', current: false, time: '2 days ago' },
        ].map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-vrd-bg border border-vrd-border"
          >
            <div className="flex items-center gap-3">
              <Monitor className="w-4 h-4 text-vrd-text-muted flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-vrd-text">{s.device}</p>
                <p className="text-[11px] text-vrd-text-dim">
                  {s.location} · {s.time}
                </p>
              </div>
            </div>
            {s.current
              ? <span className="text-[10px] font-medium text-success px-2 py-0.5 rounded-full bg-success/10 border border-success/20">Current</span>
              : <button className="text-[11px] text-danger hover:underline">Revoke</button>
            }
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Preferences section ──────────────────────────────────────────────────────

function PreferencesSection() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('dark')
  const [prefs, setPrefs] = useState({
    compactMode: false,
    sidebarCollapsed: false,
    codeFont: true,
  })

  const toggle = (k: keyof typeof prefs) => () => setPrefs((p) => ({ ...p, [k]: !p[k] }))

  return (
    <div>
      <SectionTitle>Appearance</SectionTitle>

      {/* Theme selector */}
      <div className="flex gap-2 mb-8">
        {([
          { id: 'light', label: 'Light', icon: Sun },
          { id: 'dark', label: 'Dark', icon: Moon },
          { id: 'system', label: 'System', icon: Monitor },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl border text-xs font-medium transition-all',
              theme === id
                ? 'border-primary bg-primary/10 text-primary-light'
                : 'border-vrd-border bg-vrd-bg text-vrd-text-muted hover:bg-vrd-card-hover',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <SectionTitle>Interface</SectionTitle>
      <div className="space-y-4 max-w-sm">
        {[
          { key: 'compactMode' as const, label: 'Compact mode', desc: 'Reduce spacing and card padding' },
          { key: 'sidebarCollapsed' as const, label: 'Collapse sidebar by default', desc: 'Start with the project sidebar hidden' },
          { key: 'codeFont' as const, label: 'Monospace for IDs and logs', desc: 'Use JetBrains Mono for technical identifiers' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-vrd-text">{label}</p>
              <p className="text-xs text-vrd-text-muted">{desc}</p>
            </div>
            <Toggle checked={prefs[key]} onChange={toggle(key)} />
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>Region</SectionTitle>
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div>
          <label className={label}>Language</label>
          <select className={cn(input, 'cursor-pointer')}>
            <option>English (US)</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
        <div>
          <label className={label}>Timezone</label>
          <select className={cn(input, 'cursor-pointer')}>
            <option>Europe/Paris (UTC+2)</option>
            <option>UTC</option>
            <option>America/New_York</option>
          </select>
        </div>
        <div>
          <label className={label}>Date format</label>
          <select className={cn(input, 'cursor-pointer')}>
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
          Save preferences
        </button>
      </div>
    </div>
  )
}

// ─── Notifications section ────────────────────────────────────────────────────

function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    pipelineDone: true,
    gateRequired: true,
    stageFailed: true,
    weeklyDigest: false,
    slackEnabled: false,
    emailEnabled: true,
  })

  const toggle = (k: keyof typeof notifs) => () => setNotifs((n) => ({ ...n, [k]: !n[k] }))

  return (
    <div>
      <SectionTitle>Pipeline alerts</SectionTitle>
      <div className="space-y-4 max-w-sm">
        {[
          { key: 'pipelineDone' as const, label: 'Pipeline complete', desc: 'When a full batch finishes (report ready)' },
          { key: 'gateRequired' as const, label: 'Gate requires approval', desc: 'When NLP or Scenario gate is waiting for you' },
          { key: 'stageFailed' as const, label: 'Stage failed', desc: 'When any pipeline stage encounters an error' },
          { key: 'weeklyDigest' as const, label: 'Weekly digest', desc: 'Summary of all batches run in the last 7 days' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-vrd-text">{label}</p>
              <p className="text-xs text-vrd-text-muted">{desc}</p>
            </div>
            <Toggle checked={notifs[key]} onChange={toggle(key)} />
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>Delivery channels</SectionTitle>
      <div className="space-y-4 max-w-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-vrd-text">Email notifications</p>
            <p className="text-xs text-vrd-text-muted">Send alerts to achraf.rachid@capgemini.com</p>
          </div>
          <Toggle checked={notifs.emailEnabled} onChange={toggle('emailEnabled')} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-vrd-text">Slack notifications</p>
            <p className="text-xs text-vrd-text-muted">Post alerts to a Slack webhook</p>
          </div>
          <Toggle checked={notifs.slackEnabled} onChange={toggle('slackEnabled')} />
        </div>
      </div>

      {notifs.slackEnabled && (
        <div className="mt-4 max-w-sm space-y-1.5">
          <label className={label}>Slack webhook URL</label>
          <input
            type="url"
            className={input}
            placeholder="https://hooks.slack.com/services/…"
          />
        </div>
      )}

      <div className="flex items-center gap-3 mt-8">
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
          Save notification settings
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [active, setActive] = useState<SectionId>('profile')

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-vrd-bg flex items-center justify-center">
        <div className="text-vrd-text-muted">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const ActiveSection = {
    profile: ProfileSection,
    security: SecuritySection,
    preferences: PreferencesSection,
    notifications: NotificationsSection,
  }[active]

  return (
    <div className="min-h-screen bg-vrd-bg text-vrd-text">
      {/* Top header */}
      <header className="h-12 flex items-center px-6 border-b border-vrd-border bg-vrd-sidebar flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-vrd-text-muted hover:text-vrd-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Veridian
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-vrd-text">Account Settings</span>
          </div>
        </div>
        <div className="w-24" />
      </header>

      <div className="flex h-[calc(100vh-3rem)]">
        {/* Left sidebar nav */}
        <aside className="w-56 flex-shrink-0 border-r border-vrd-border bg-vrd-sidebar flex flex-col">
          {/* User card */}
          <div className="px-4 py-5 border-b border-vrd-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-white">{getInitials(session.user.name)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-vrd-text truncate">{session.user.name || 'User'}</p>
                <p className="text-[10px] text-vrd-text-dim truncate">{session.user.email}</p>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left',
                  active === id
                    ? 'bg-primary/15 text-primary-light'
                    : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
                )}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-vrd-border">
            <p className="text-[10px] text-vrd-text-dim">Veridian v1.0.0</p>
            <p className="text-[10px] text-vrd-text-dim">Capgemini Engineering</p>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-8">
            {/* Section header */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-vrd-text capitalize">
                {SECTIONS.find((s) => s.id === active)?.label}
              </h2>
              <p className="text-sm text-vrd-text-muted mt-0.5">
                {active === 'profile' && 'Manage your personal information and account details.'}
                {active === 'security' && 'Control your password, API keys, and active sessions.'}
                {active === 'preferences' && 'Customize the Veridian interface to match your workflow.'}
                {active === 'notifications' && 'Choose which events trigger alerts and how they are delivered.'}
              </p>
            </div>

            {active === 'profile' && <ProfileSection userEmail={session.user.email} />}
            {active === 'security' && <SecuritySection />}
            {active === 'preferences' && <PreferencesSection />}
            {active === 'notifications' && <NotificationsSection />}
          </div>
        </main>
      </div>
    </div>
  )
}
