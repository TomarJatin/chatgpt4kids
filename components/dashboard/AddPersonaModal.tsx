'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { LoaderIcon } from '@/components/icons'

export interface LivePersona {
  id: string
  displayName: string
  avatar: string | null
  type: 'child' | 'parent'
  needsPin?: boolean
}

interface Props {
  onClose: () => void
  onCreated: (newChild: LivePersona) => void
}

export default function AddChildModal({ onClose, onCreated }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }
    setSaving(true)
    try {
      let avatarUrl: string | null = null
      if (file) {
        const { uploadUrl, publicUrl } = await fetch(
          '/api/parent/children/avatar-upload-url',
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, contentType: file.type }),
          }
        ).then(r => r.json())

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        avatarUrl = publicUrl
      }

      const res = await fetch('/api/personas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), type: 'child', avatar: avatarUrl, pin: null }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to add child')
      }
      const created = (await res.json()) as LivePersona
      onCreated(created)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={val => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Add Child Profile</DialogTitle>
          <DialogClose asChild>
            {/* <Button variant="ghost" size="icon">
              <XMarkIcon className="h-5 w-5" />
            </Button> */}
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="space-y-1">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
            />
          </div>

          {/* <div className="space-y-1">
            <Label>Avatar (optional)</Label>
            <div className="flex items-center space-x-4">
              <Avatar>
                {previewUrl
                  ? <AvatarImage src={previewUrl} alt="Avatar preview" />
                  : <AvatarFallback>
                      <UserCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </AvatarFallback>
                }
              </Avatar>
              <Input
                type="file"
                accept="image/*"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div> */}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span className="flex items-center">
                  Adding… <LoaderIcon  />
                </span>
              ) : (
                'Add Child'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}