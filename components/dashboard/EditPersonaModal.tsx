'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { LoaderIcon } from '@/components/icons'

interface Props {
  personaId: string
  currentName: string
  currentAvatar: string | null
  onClose: () => void
  onSaved: (newName: string, newAvatarUrl: string | null) => void
}

export default function EditPersonaModal({
  personaId,
  currentName,
  currentAvatar,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState(currentName)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(currentAvatar)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // regenerate preview when file changes
  useEffect(() => {
    if (!avatarFile) {
      setPreview(currentAvatar)
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile, currentAvatar])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      let avatarUrl = currentAvatar
      // if new file selected, upload
      if (avatarFile) {
        const { uploadUrl, publicUrl } = await fetch(
          `/api/parent/children/${personaId}/avatar-upload-url`,
          { method: 'POST', credentials: 'include' }
        ).then(r => r.json())
        await fetch(uploadUrl, { method: 'PUT', body: avatarFile })
        avatarUrl = publicUrl
      }
      // save name + avatarUrl
      const res = await fetch(
        `/api/parent/children/${personaId}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: name, avatar: avatarUrl }),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Save failed')
      }
      onSaved(name, avatarUrl)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogClose asChild>
            {/* <Button variant="ghost" size="icon">
              <XMarkIcon className="h-5 w-5" />
            </Button> */}
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {/* Avatar upload */}
          <div className="space-y-1">
            <Label>Avatar</Label>
            <div className="flex items-center space-x-4">
              <Avatar>
                {preview ? (
                  <AvatarImage src={preview} alt="Avatar preview" />
                ) : (
                  <AvatarFallback>
                    <UserCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </AvatarFallback>
                )}
              </Avatar>
              <Input
                type="file"
                accept="image/*"
                onChange={e => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* Name field */}
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? (
                <span className="flex items-center">
                  Saving… <LoaderIcon size={16} />
                </span>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}