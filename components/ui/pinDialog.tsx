'use client'

import React, { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type PinMode = 'set' | 'verify'

export interface PinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: PinMode
  personaId: string
}

/**
 * A reusable Set/Verify-PIN dialog.
 */
export function PinDialog({
  open,
  onOpenChange,
  mode,
  personaId,
}: PinDialogProps) {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // reset state when reopening
  useEffect(() => {
    if (open) {
      setPin('')
      setConfirmPin('')
      setError(null)
      setBusy(false)
    }
  }, [open])



  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'set') {
      if (pin.length < 4) return setError('PIN must be at least 4 digits')
      if (pin !== confirmPin) return setError('PINs do not match')
    }

    setBusy(true)
    try {
      const res = await fetch(
        mode === 'set'
          ? '/api/parent/profile'
          : '/api/parent/verify-pin',
        mode === 'set' ?  
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        } : {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personaId, pin }),
        }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Request failed')
      }

      onOpenChange(false)

      if (mode === 'verify') {
        router.push('/parent/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {mode === 'set' ? 'Set Parent PIN' : 'Enter Parent PIN'}
          </DialogTitle>
          <DialogClose asChild>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-1">
            <Label>PIN</Label>
            <Input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              maxLength={6}
              autoFocus
              required
            />
          </div>

          {mode === 'set' && (
            <div className="space-y-1">
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                maxLength={6}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !pin || (mode === 'set' && !confirmPin)}>
              {busy
                ? mode === 'set'
                  ? 'Setting…'
                  : 'Verifying…'
                : mode === 'set'
                ? 'Set PIN'
                : 'Verify PIN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
