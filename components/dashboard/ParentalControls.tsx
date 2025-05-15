'use client'

import React, { useEffect, useState, FormEvent } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { LoaderIcon } from '@/components/icons'
import type { PersonaSettings } from '@/lib/db/schema'

interface Props {
  childId: string
  childName: string
}

type Settings = {
  personaId:            string
  topicRestriction:     number    // 0–100
  violenceFilterLevel:  number    // 0–100
  politicsFilterLevel:  number    // 0–100
  homeworkMode:         boolean
  wordFilteringEnabled: boolean
}

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

  // Load settings
  useEffect(() => {
    fetch(`/api/parent/children/${childId}/settings`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((json: PersonaSettings & any) => {
        setSettings({
          personaId:            json.personaId,
          topicRestriction:     (json.topicRestriction ?? json.topicRestrictionPct) as number,
          violenceFilterLevel:  json.violenceFilterLevel  as number,
          politicsFilterLevel:  json.politicsFilterLevel  as number,
          homeworkMode:         json.homeworkMode          as boolean,
          wordFilteringEnabled: json.wordFilteringEnabled  as boolean,
        })
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [childId])

  // Load word filters
  useEffect(() => {
    fetch(`/api/parent/children/${childId}/wordfilter`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((list: { id: string; word: string }[]) => {
        setOriginalFilters(list)
        setWordFilters(list.map(f => f.word))
      })
      .catch(() => {})
  }, [childId])

  function resetToDefaults() {
    if (!settings) return
    setSettings({
      ...settings,
      topicRestriction:     50,
      violenceFilterLevel:  0,
      politicsFilterLevel:  0,
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
        body: JSON.stringify({
          topicRestriction:     settings.topicRestriction,
          violenceFilterLevel:  settings.violenceFilterLevel,
          politicsFilterLevel:  settings.politicsFilterLevel,
          homeworkMode:         settings.homeworkMode,
          wordFilteringEnabled: settings.wordFilteringEnabled,
        }),
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

  if (loading)   return <p className="text-gray-600 dark:text-gray-400">Loading…</p>
  if (error)     return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!settings) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Restrictions </CardTitle>
        <CardDescription>Control what types of content {childName} can access</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sliders */}
          <div className="space-y-6">
            {/* Topic */}
            <div className="space-y-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Topic Restriction</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Content Restriction Level</p>
              <Slider
                value={[settings.topicRestriction]}
                onValueChange={([v]) => setSettings(s => ({ ...s!, topicRestriction: v }))}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {settings.topicRestriction === 0? 'Off': `${settings.topicRestriction}%`}
              </p>
            </div>
            {/* Violence */}
            <div className="space-y-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Filter Violence</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Block violent content</p>
              <Slider
                value={[settings.violenceFilterLevel]}
                onValueChange={([v]) => setSettings(s => ({ ...s!, violenceFilterLevel: v }))}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {settings.violenceFilterLevel === 0? 'Off': `${settings.violenceFilterLevel}%`}
              </p>
            </div>
            {/* Politics */}
            <div className="space-y-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Filter Politics</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Block political content</p>
              <Slider
                value={[settings.politicsFilterLevel]}
                onValueChange={([v]) => setSettings(s => ({ ...s!, politicsFilterLevel: v }))}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {settings.politicsFilterLevel === 0? 'Off': `${settings.politicsFilterLevel}%`}
              </p>
            </div>
            {/* Homework Mode */}
            <ToggleRow
              label="Homework Mode Only"
              desc="Only allows educational content related to schoolwork"
              checked={settings.homeworkMode}
              onChange={v => setSettings(s => ({ ...s!, homeworkMode: v }))}
              disabled={saving}
            />
          </div>

          <Separator />

          {/* Save / Reset */}
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={resetToDefaults} disabled={saving}>
              Reset
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><LoaderIcon size={20} />Saving…</> : 'Save Changes'}
            </Button>
          </div>

          <Separator />

          {/* Word Filtering */}
          <div className="space-y-4">
            <h3 className="text-xl text-blue-600">Word Filtering</h3>
            <ToggleRow
              label="Enable Word Filtering"
              desc="Block inappropriate language and get notifications when flagged"
              checked={settings.wordFilteringEnabled}
              onChange={v => setSettings(s => ({ ...s!, wordFilteringEnabled: v }))}
            />
            <div className="flex flex-wrap gap-2">
              {wordFilters.map(w => (
                <span key={w} className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-lg px-3 py-1 text-sm">
                  {w}
                  <button
                    type="button"
                    onClick={() => setWordFilters(wordFilters.filter(x => x !== w))}
                    className="ml-2 hover:text-red-600 dark:hover:text-red-400"
                    disabled={wfSaving}
                  >×</button>
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => setWordFilters([])} disabled={wfSaving}>
                Reset
              </Button>
              <Button onClick={saveWordFilters} disabled={wfSaving}>
                {wfSaving ? <><LoaderIcon size={20}/>Saving…</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
