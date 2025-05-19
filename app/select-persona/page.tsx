'use client'

import React, { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PersonaSelector, { Persona } from '@/components/PersonaSelector'
import AddPersonaModal, { LivePersona } from '@/components/dashboard/AddPersonaModal'
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
import { ModeToggle } from '@/components/ui/ThemeToggleButton'
import { PinDialog, PinMode } from '@/components/ui/pinDialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function SelectPersonaPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [personas, setPersonas]   = useState<LivePersona[]|null>(null)
  const [loadError, setLoadError] = useState<string|null>(null)

  // PIN modal state
  const [pinModalOpen, setPinModalOpen]       = useState(false)
  const [pinMode, setPinMode]                 = useState<'set'|'verify'>('verify')
  const [pendingPersona, setPendingPersona]   = useState<LivePersona|null>(null)
  const [pin, setPin]                         = useState('')
  const [confirmPin, setConfirmPin]           = useState('')
  const [pinError, setPinError]               = useState<string|null>(null)
  const [isSubmittingPin, setIsSubmittingPin] = useState(false)

  // Add‐Child modal state
  const [addModalOpen, setAddModalOpen]       = useState(false)

  // load personas
  async function loadPersonas() {
    try {
      const res = await fetch('/api/personas', { credentials: 'include' })
      if (!res.ok) throw new Error()
      const list = (await res.json()) as LivePersona[]
      setPersonas(list)
      setLoadError(null)

      const parent = list.find(p => p.type === 'parent' && p.needsPin)
      if (parent) openPin(parent, 'set')
    } catch {
      setLoadError('Unable to load personas.')
    }
  }

  function openPin(p: LivePersona, mode: 'set'|'verify') {
    setPendingPersona(p)
    setPinMode(mode)
    setPin('')
    setConfirmPin('')
    setPinError(null)
    setPinModalOpen(true)
  }

  function handleSelect(p: LivePersona) {
    if (p.type === 'child') {
      router.push(`/chat/new?childPersonaId=${p.id}`)
    } else {
      openPin(p, p.needsPin ? 'set' : 'verify')
    }
  }

  useEffect(() => {
    if (status === 'authenticated') loadPersonas()
  }, [status])

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  async function handlePinSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pendingPersona) return
    setPinError(null)
    setIsSubmittingPin(true)

    try {
      let res: Response
      if (pinMode === 'set') {
        if (pin.length < 4) throw new Error('PIN must be at least 4 digits')
        if (pin !== confirmPin) throw new Error('PINs do not match')
        res = await fetch('/api/parent/profile', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        })
      } else {
        res = await fetch('/api/parent/verify-pin', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personaId: pendingPersona.id, pin }),
        })
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed')
      }
      setPinModalOpen(false)
      if (pinMode === 'verify') router.push('/parent/dashboard')
      else await loadPersonas()
    } catch (err: any) {
      setPinError(err.message)
    } finally {
      setIsSubmittingPin(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-4 relative">
        <div className="absolute top-4 right-4">
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        
        <Skeleton className="h-12 w-48 mb-12" />
        
        <PersonaSelector
          personas={[]}
          onSelect={() => {}}
          onAdd={() => {}}
          isLoading={true}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100 mb-12">
        Select Persona
      </h1>

      {loadError ? (
        <p className="text-red-500">{loadError}</p>
      ) : (
        personas && (
          <PersonaSelector
            personas={personas}
            onSelect={handleSelect}
            onAdd={() => setAddModalOpen(true)}
          />
        )
      )}

      {/* Set/Verify PIN Dialog */}
      {/* {pinModalOpen && pendingPersona && (
        <Dialog open onOpenChange={() => setPinModalOpen(false)}>
          <DialogContent className="sm:max-w-md w-full">
            <DialogHeader>
              <DialogTitle>
                {pinMode === 'set' ? 'Set Parent PIN' : 'Verify Parent PIN'}
              </DialogTitle>
              <DialogClose asChild>
              </DialogClose>
            </DialogHeader>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              {pinError && (
                <p className="text-sm text-red-600">{pinError}</p>
              )}
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
              {pinMode === 'set' && (
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
                <Button variant="outline" onClick={() => setPinModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingPin || !pin || (pinMode === 'set' && !confirmPin)}>
                  {isSubmittingPin
                    ? pinMode === 'set' ? 'Setting…' : 'Verifying…'
                    : pinMode === 'set' ? 'Set PIN' : 'Verify PIN'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )} */}

    {pendingPersona && (
       <PinDialog
         open={pinModalOpen}
         onOpenChange={setPinModalOpen}
         mode={pinMode}
         personaId={pendingPersona.id}
       />
     )}

      {/* Add Child Dialog */}
      {addModalOpen && (
        <AddPersonaModal
          onClose={() => setAddModalOpen(false)}
          onCreated={handleSelect as any}
        />
      )}
    </div>
  )
}