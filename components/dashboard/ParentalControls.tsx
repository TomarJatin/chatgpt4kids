'use client'

import React, { useEffect, useState, FormEvent } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { LoaderIcon } from '@/components/icons'
import type { PersonaSettings } from '@/lib/db/schema'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

interface Props {
  childId: string
  childName: string
}

type Settings = {
  personaId:            string
  topicRestriction:     'low' | 'medium' | 'high'
  violenceFilterLevel:  'low' | 'medium' | 'high'
  politicsFilterLevel:  'low' | 'medium' | 'high'
  homeworkMode:         boolean
  wordFilteringEnabled: boolean
}

const FILTER_LABELS = ['Low', 'Medium', 'High'] as const
const FILTER_VALUES = ['low', 'medium', 'high'] as const

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string
  desc?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium text-gray-700 dark:text-gray-300">{label}</h4>
        {desc && <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="h-5 w-9"
      />
    </div>
  )
}

export default function ParentalControls({ childId, childName }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  const [wordFilters, setWordFilters]         = useState<string[]>([])
  const [originalFilters, setOriginalFilters] = useState<{ id: string; word: string }[]>([])
  const [wfError, setWfError]                 = useState<string | null>(null)
  const [wfSaving, setWfSaving]               = useState(false)
  const [wfLoading, setWfLoading]             = useState(true)
  const [newWord, setNewWord]                 = useState('')

  // Load settings
  useEffect(() => {
    fetch(`/api/parent/children/${childId}/settings`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((json: PersonaSettings & any) => {
        setSettings({
          personaId:            json.personaId,
          topicRestriction:     json.topicRestriction,
          violenceFilterLevel:  json.violenceFilterLevel,
          politicsFilterLevel:  json.politicsFilterLevel,
          homeworkMode:         json.homeworkMode as boolean,
          wordFilteringEnabled: json.wordFilteringEnabled as boolean,
        })
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [childId])

  // Load word filters
  useEffect(() => {
    setWfLoading(true)
    fetch(`/api/parent/children/${childId}/wordfilter`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((list: { id: string; word: string }[]) => {
        setOriginalFilters(list)
        setWordFilters(list.map(f => f.word))
      })
      .catch(() => {})
      .finally(() => setWfLoading(false))
  }, [childId])

  function resetToDefaults() {
    if (!settings) return
    setSettings({
      ...settings,
      topicRestriction:     'low',
      violenceFilterLevel:  'low',
      politicsFilterLevel:  'low',
      homeworkMode:         false,
      wordFilteringEnabled: false,
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!settings) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/parent/children/${childId}/settings`, {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Save failed')
      const updated = (await res.json()) as PersonaSettings & any
      setSettings({
        personaId:            updated.personaId,
        topicRestriction:     updated.topicRestriction,
        violenceFilterLevel:  updated.violenceFilterLevel,
        politicsFilterLevel:  updated.politicsFilterLevel,
        homeworkMode:         updated.homeworkMode,
        wordFilteringEnabled: updated.wordFilteringEnabled,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveWordFilters() {
    setWfError(null)
    setWfSaving(true)
    try {
      const toAdd    = wordFilters.filter(w => !originalFilters.some(f => f.word === w))
      const toDelete = originalFilters.filter(f => !wordFilters.includes(f.word))

      await Promise.all(toAdd.map(w =>
        fetch(`/api/parent/children/${childId}/wordfilter`, {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type':'application/json' },
          body:        JSON.stringify({ word: w }),
        }).then(r => { if (!r.ok) throw new Error(`Failed to add "${w}"`) })
      ))

      await Promise.all(toDelete.map(f =>
        fetch(`/api/parent/children/${childId}/wordfilter/${f.id}`, {
          method:      'DELETE',
          credentials: 'include',
        }).then(r => { if (!r.ok) throw new Error(`Failed to remove "${f.word}"`) })
      ))

      const updated = await fetch(`/api/parent/children/${childId}/wordfilter`, { credentials: 'include' })
        .then(r => r.json())
      setOriginalFilters(updated)
      setWordFilters(updated.map((f: any) => f.word))
    } catch (err: any) {
      setWfError(err.message)
    } finally {
      setWfSaving(false)
    }
  }

  if (loading) return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-64 mt-1" />
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Skeleton for three sliders */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        ))}
        
        <Separator />
        
        {/* Skeleton for buttons */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        <Separator />
        
        {/* Skeleton for word filtering section */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          
          <Skeleton className="h-10 w-full" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
  
  if (error) return (
    <Card>
      <CardHeader>
        <CardTitle>Content Restrictions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <Button 
          className="mt-4" 
          onClick={() => {
            setError(null)
            setLoading(true)
            fetch(`/api/parent/children/${childId}/settings`, { credentials: 'include' })
              .then(r => { if (!r.ok) throw new Error(); return r.json() })
              .then((json: PersonaSettings & any) => {
                setSettings({
                  personaId:            json.personaId,
                  topicRestriction:     json.topicRestriction,
                  violenceFilterLevel:  json.violenceFilterLevel,
                  politicsFilterLevel:  json.politicsFilterLevel,
                  homeworkMode:         json.homeworkMode as boolean,
                  wordFilteringEnabled: json.wordFilteringEnabled as boolean,
                })
              })
              .catch(() => setError('Failed to load settings'))
              .finally(() => setLoading(false))
          }}
        >
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
  
  if (!settings) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Restrictions</CardTitle>
        <CardDescription>
          Control what types of content {childName} can access
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Three‐step Sliders */}
          {(['Topic Restriction','Filter Violence','Filter Politics'] as const).map((label, idx) => {
            const key = idx === 0
              ? 'topicRestriction'
              : idx === 1
                ? 'violenceFilterLevel'
                : 'politicsFilterLevel'
            const value = settings[key]
            
            // Map string enum to slider index 
            const valueIndex = FILTER_VALUES.indexOf(value)
            
            return (
              <div key={key} className="space-y-1">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{label}</h4>
                <Slider
                  value={[valueIndex]}
                  onValueChange={([v]) => setSettings(s => ({ ...s!, [key]: FILTER_VALUES[v] }))}
                  min={0}
                  max={2}
                  step={1}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {FILTER_LABELS[valueIndex]}
                </p>
              </div>
            )
          })}

          <Separator />

          {/* Save / Reset */}
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={resetToDefaults} disabled={saving}>
              Reset
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><LoaderIcon size={20} /> Saving…</> : 'Save Changes'}
            </Button>
          </div>

          <Separator />

          {/* Word Filtering */}
          <div className="space-y-4">
            <h3 className="text-xl text-blue-600">Word Filtering</h3>

            {/* Input for adding new filter words */}
            <Input
              placeholder="Add word to filter"
              value={newWord}
              onChange={e => setNewWord(e.currentTarget.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const w = newWord.trim()
                  if (w && !wordFilters.includes(w)) {
                    setWordFilters(ws => [...ws, w])
                  }
                  setNewWord('')
                }
              }}
            />

            <div className="flex flex-wrap gap-2">
              {wfLoading ? (
                <div className="w-full py-4 flex justify-center">
                  <div className="text-blue-500">
                    <LoaderIcon size={24} />
                  </div>
                </div>
              ) : wordFilters.length > 0 ? (
                wordFilters.map(w => (
                  <span
                    key={w}
                    className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-lg px-3 py-1 text-sm"
                  >
                    {w}
                    <button
                      type="button"
                      onClick={() => setWordFilters(ws => ws.filter(x => x !== w))}
                      className="ml-2 hover:text-red-600 dark:hover:text-red-400"
                      disabled={wfSaving}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <div className="w-full py-4 text-center text-gray-500 dark:text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                  No filtered words added yet. Type a word above and press Enter.
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => setWordFilters([])} disabled={wfSaving}>
                Reset
              </Button>
              <Button onClick={saveWordFilters} disabled={wfSaving}>
                {wfSaving ? <><LoaderIcon size={20}/> Saving…</> : 'Save Changes'}
              </Button>
            </div>

            {wfError && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mt-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{wfError}</p>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
