'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import {
  Send, FileText, Type, ChevronDown, PlugZap, Cloud, GitBranch,
  LayoutList, FileSpreadsheet, CheckCircle2, RefreshCw, X, Loader2, AlertCircle,
} from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { ACCEPTED_EXTENSIONS } from '@/lib/file-parsers'
import { cn } from '@/lib/utils'

type InputMode = 'text' | 'file' | 'connector'

interface ComposerProps {
  conversationId: string
  centered?: boolean
}

const MODELS = [
  { id: 'queen3',  label: 'Queen3',  desc: 'Most capable' },
  { id: 'gpt-oss', label: 'GPT OSS', desc: 'Balanced' },
  { id: 'kimik2',  label: 'Kimik2',  desc: 'Fast' },
]

const CONNECTORS = [
  { id: 'jira',       label: 'Jira',          desc: 'Sprint / epic picker',         icon: LayoutList },
  { id: 'azure',      label: 'Azure DevOps',  desc: 'Work items & test plans',      icon: Cloud },
  { id: 'github',     label: 'GitHub Issues', desc: 'Filter by label or milestone',  icon: GitBranch },
  { id: 'sharepoint', label: 'SharePoint',    desc: 'Excel requirements files',      icon: FileSpreadsheet },
]

export default function Composer({ conversationId, centered }: ComposerProps) {
  const [mode, setMode] = useState<InputMode>('text')
  const [value, setValue] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-oss')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [connectorDropdownOpen, setConnectorDropdownOpen] = useState(false)
  const [activeConnector, setActiveConnector] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const connectorDropdownRef = useRef<HTMLDivElement>(null)

  const { submit, refactor, getPipeline } = usePipelineStore()
  const pipeline = getPipeline(conversationId)
  const isComplete = pipeline.stage === 4 && pipeline.report === 'awaiting'

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node))
        setModelDropdownOpen(false)
    }
    if (modelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [modelDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (connectorDropdownRef.current && !connectorDropdownRef.current.contains(e.target as Node))
        setConnectorDropdownOpen(false)
    }
    if (connectorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [connectorDropdownOpen])

  const clearFile = () => {
    setSelectedFile(null)
    setFileError(null)
    if (fileRef.current) fileRef.current.value = ''
    setMode('text')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setFileError(null)
    setMode('file')
  }

  const canSend = isParsing
    ? false
    : mode === 'file'
      ? selectedFile !== null
      : value.trim().length > 0

  const handleSend = async () => {
    if (!canSend) return

    if (isComplete) {
      refactor(conversationId, value.trim())
      setValue('')
      return
    }

    if (mode === 'file' && selectedFile) {
      setIsParsing(true)
      setFileError(null)
      try {
        const form = new FormData()
        form.append('file', selectedFile)
        const res = await fetch('/api/parse-file', { method: 'POST', body: form })
        const json = await res.json() as { requirements?: string[]; error?: string }
        if (!res.ok || !json.requirements) {
          setFileError(json.error ?? 'Failed to parse file')
          return
        }
        submit(conversationId, json.requirements, selectedFile.name)
        clearFile()
      } finally {
        setIsParsing(false)
      }
      return
    }

    // Text / connector mode
    const requirements = value.trim().split('\n').map(l => l.trim()).filter(Boolean)
    submit(conversationId, requirements)
    setValue('')
  }

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() }
  }

  const handleConnectorSelect = (connectorId: string) => {
    setActiveConnector(connectorId)
    setMode('connector')
    setConnectorDropdownOpen(false)
    const connector = CONNECTORS.find(c => c.id === connectorId)
    setValue(`[Connected to ${connector?.label}] `)
  }

  const activeConnectorData = CONNECTORS.find(c => c.id === activeConnector)

  const getPlaceholder = () => {
    if (isComplete) return 'Describe a change — e.g. "Increase pedestrian detection distance to 25 m in AEB scenarios"'
    if (mode === 'connector' && activeConnectorData) return `Connected to ${activeConnectorData.label} — describe which items to pull…`
    return 'Enter requirements, one per line…'
  }

  const getHint = () => {
    if (isComplete) return 'Post-completion refactor · agent detects entry stage'
    if (mode === 'file') return ACCEPTED_EXTENSIONS.join('  ') + ' accepted'
    if (mode === 'connector') return `MCP — ${activeConnectorData?.label ?? 'connector'}`
    return 'Shift+Enter for newline'
  }

  return (
    <div className={cn('w-full', centered && 'max-w-2xl mx-auto')}>
      {centered && (
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-vrd-text">New batch submission</h2>
          <p className="text-sm text-vrd-text-muted mt-1">
            Enter requirements, upload a file, or connect a requirements tool to start validation.
          </p>
        </div>
      )}

      {isComplete && (
        <div className="flex items-center gap-2 px-1 pb-2">
          <RefreshCw className="w-3 h-3 text-primary-light" />
          <span className="text-[11px] text-primary-light font-medium">Pipeline complete — type an instruction to refactor</span>
        </div>
      )}

      <div className={cn(
        'rounded-xl border bg-vrd-card transition-colors',
        isComplete ? 'border-primary/30 focus-within:border-primary/60' : 'border-vrd-border focus-within:border-primary/40',
      )}>
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 pt-2">
          {/* Text mode */}
          <button
            onClick={() => { clearFile(); setMode('text') }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              mode === 'text'
                ? 'bg-primary/10 text-primary-light'
                : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
            )}
          >
            <Type className="w-3 h-3" />
            Text
          </button>

          {/* File mode */}
          <button
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              mode === 'file'
                ? 'bg-primary/10 text-primary-light'
                : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
            )}
          >
            <FileText className="w-3 h-3" />
            File
          </button>

          {/* Connectors dropdown */}
          <div className="relative" ref={connectorDropdownRef}>
            <button
              onClick={() => setConnectorDropdownOpen(!connectorDropdownOpen)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                mode === 'connector'
                  ? 'bg-primary/10 text-primary-light'
                  : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
              )}
            >
              <PlugZap className="w-3 h-3" />
              {mode === 'connector' && activeConnectorData ? activeConnectorData.label : 'Connect'}
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {connectorDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 rounded-xl border border-vrd-border bg-vrd-card shadow-xl z-50 overflow-hidden w-56">
                <div className="px-3 py-2 border-b border-vrd-border">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-vrd-text-dim">Requirements Sources</p>
                </div>
                {CONNECTORS.map(connector => {
                  const Icon = connector.icon
                  const isActive = activeConnector === connector.id
                  return (
                    <button
                      key={connector.id}
                      onClick={() => handleConnectorSelect(connector.id)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors',
                        isActive
                          ? 'bg-primary/10 text-vrd-text'
                          : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
                      )}
                    >
                      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', isActive && 'text-primary-light')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-none">{connector.label}</p>
                        <p className="text-[10px] text-vrd-text-dim mt-0.5">{connector.desc}</p>
                      </div>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-primary-light flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* File chip — shown instead of textarea when a file is selected */}
        {mode === 'file' && selectedFile ? (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 w-fit max-w-full">
              <FileSpreadsheet className="w-4 h-4 text-primary-light flex-shrink-0" />
              <span className="text-sm text-vrd-text font-mono truncate max-w-xs">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-vrd-text-dim flex-shrink-0">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={clearFile}
                className="ml-1 text-vrd-text-muted hover:text-vrd-text transition-colors flex-shrink-0"
                aria-label="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {fileError && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-danger">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {fileError}
              </div>
            )}
          </div>
        ) : (
          <textarea
            rows={centered ? 4 : 2}
            placeholder={getPlaceholder()}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            className="w-full bg-transparent resize-none px-4 py-3 text-sm text-vrd-text placeholder:text-vrd-text-dim focus:outline-none font-mono"
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-3 pb-2 gap-2">
          <div className="flex items-center gap-2">
            {/* Model selector */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover transition-colors"
              >
                {MODELS.find(m => m.id === selectedModel)?.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              {modelDropdownOpen && (
                <div className="absolute bottom-full mb-1 left-0 rounded-lg border border-vrd-border bg-vrd-card shadow-lg z-50 overflow-hidden min-w-max">
                  {MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setModelDropdownOpen(false) }}
                      className={cn(
                        'flex flex-col px-3 py-2 text-[10px] w-full text-left transition-colors',
                        selectedModel === model.id
                          ? 'bg-primary/10 text-primary-light'
                          : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
                      )}
                    >
                      <span className="font-medium">{model.label}</span>
                      <span className="text-vrd-text-dim text-[9px]">{model.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-vrd-text-dim">{getHint()}</span>
          </div>

          <button
            onClick={() => void handleSend()}
            disabled={!canSend}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
              isComplete
                ? 'bg-primary/80 hover:bg-primary'
                : 'bg-primary hover:bg-primary-hover',
            )}
          >
            {isParsing
              ? <><Loader2 className="w-3 h-3 animate-spin" />Parsing…</>
              : isComplete
                ? <><RefreshCw className="w-3 h-3" />Refactor</>
                : <><Send className="w-3 h-3" />Send</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
