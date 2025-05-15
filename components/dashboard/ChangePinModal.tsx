'use client'

import React, { useState, FormEvent } from 'react'
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
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LoaderIcon } from '@/components/icons'

interface Props {
  personaId: string
  onClose: () => void
}

export default function ChangePinModal({ personaId, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'verify' | 'set'>('verify')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (currentPin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }
    setBusy(true)
    const res = await fetch('/api/parent/verify-pin', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId, pin: currentPin }),
    })
    setBusy(false)
    if (res.ok) {
      setStep('set')
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Invalid PIN')
    }
  }

  async function handleChange(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPin.length < 4) {
      setError('New PIN must be at least 4 digits')
      return
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match')
      return
    }
    setBusy(true)
    const res = await fetch('/api/parent/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin, pin: newPin }),
    })
    setBusy(false)
    if (res.ok) {
      onClose()
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Failed to change PIN')
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Change Parent PIN</DialogTitle>
          <DialogClose asChild>
            {/* <Button variant="ghost" size="icon">
              <XMarkIcon className="h-5 w-5" />
            </Button> */}
          </DialogClose>
        </DialogHeader>

        <form
          onSubmit={step === 'verify' ? handleVerify : handleChange}
          className="space-y-4"
        >
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {step === 'verify' ? (
            <div className="space-y-1">
              <Label htmlFor="currentPin">Enter Existing PIN</Label>
              <Input
                id="currentPin"
                type="password"
                value={currentPin}
                onChange={e => setCurrentPin(e.target.value)}
                placeholder="••••"
                maxLength={6}
                autoFocus
              />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <Label htmlFor="newPin">New PIN</Label>
                <Input
                  id="newPin"
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPin">Confirm PIN</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || (step === 'verify'
                ? currentPin.length < 4
                : newPin.length < 4 || newPin !== confirmPin)}
            >
              {busy ? (
                <span className="flex items-center">
                  {step === 'verify' ? 'Verifying…' : 'Changing…'}
                  {/* <LoaderIcon className="ml-2 animate-spin" size={16} /> */}
                </span>
              ) : step === 'verify' ? (
                'Verify'
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
