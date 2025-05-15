'use client'

import React, { useEffect, useState, FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import ChildSelector from '@/components/dashboard/ChildSelectors'
import Tabs from '@/components/dashboard/Tabs'
import ParentalControls from '@/components/dashboard/ParentalControls'
import UsageReports from '@/components/dashboard/UsageReports'
import ChatSummaries from '@/components/dashboard/ChatSummaries'
import ChangePinModal from '@/components/dashboard/ChangePinModal'
import AccountManagement from '@/components/dashboard/AccountManagement'
import EditPersonaModal from '@/components/dashboard/EditPersonaModal'
import AddChildModal, { LivePersona } from '@/components/dashboard/AddPersonaModal'

import { ModeToggle } from '@/components/ui/ThemeToggleButton'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/toast'

type Child = { id: string; displayName: string; avatar: string | null }
type ParentDashboard = {
  parent: Child
  children: Child[]
}

export default function ParentDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null)
  const [activeChild, setActiveChild] = useState<Child | null>(null)

  // tabs: controls / reports / account
  const [activeTab, setActiveTab] = useState<'controls'|'reports'|'account'>('controls')

  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string|null>(null)

  const [childToDelete, setChildToDelete] = useState<Child | null>(null)

  // modals
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [addModalOpen, setAddModalOpen]     = useState(false)
  const [editing, setEditing] = useState<{
    id: string
    name: string
    avatar: string|null
  }|null>(null)

  // greeting
  const [greeting, setGreeting] = useState('Hello')
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  // fetch dashboard data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/parent/dashboard', { credentials: 'include' })
        .then(r => {
          if (!r.ok) throw new Error('Failed to load dashboard')
          return r.json() as Promise<ParentDashboard>
        })
        .then(data => {
          setDashboard(data)
          setActiveChild(data.children[0] || null)
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }
  }, [status, router])



  async function confirmDelete() {
    if (!childToDelete) return
    try {
      const res = await fetch(`/api/personas/${childToDelete.id}`, {
        method: 'DELETE', credentials: 'include'
      })
      if (!res.ok) throw new Error('Delete failed')

      // update UI
      setDashboard(d => d && ({
        parent: d.parent,
        children: d.children.filter(c => c.id !== childToDelete.id)
      }))
      if (activeChild?.id === childToDelete.id) {
        const remaining = dashboard?.children.filter(c => c.id !== childToDelete.id) || []
        setActiveChild(remaining[0] || null)
      }

      toast({ type: 'success', description: 'Profile deleted successfully.' })
    } catch (e: any) {
      toast({ type: 'error', description: e.message || 'Failed to delete' })
    } finally {
      setChildToDelete(null)
    }
  }


  if (loading) return <p className="text-gray-500">Loading…</p>
  if (error || !dashboard) return <p className="text-red-600">{error || 'Unknown error'}</p>

  // handlers
  function handleAddClick() {
    setAddModalOpen(true)
  }
  function handleChildCreated(child: LivePersona) {
    setDashboard(d => d && ({
      parent:   d.parent,
      children: [...d.children, { id: child.id, displayName: child.displayName, avatar: child.avatar }],
    }))
    setAddModalOpen(false)
  }
  function onEditClick(id: string, name: string, avatar: string|null) {
    setEditing({ id, name, avatar })
  }
  function onSaved(name: string, avatar: string|null) {
    setDashboard(d => {
      if (!d) return d
      if (editing!.id === d.parent.id) {
        return { parent: { ...d.parent, displayName: name, avatar }, children: d.children }
      }
      return {
        parent: d.parent,
        children: d.children.map(c =>
          c.id === editing!.id ? { ...c, displayName: name, avatar } : c
        ),
      }
    })
    setEditing(null)
  }

  return (
    <div className="container mx-auto p-8 bg-white dark:bg-black min-h-screen space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold dark:text-white">
          {greeting}, {dashboard.parent.displayName}
        </h1>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPinModalOpen(true)}
          >
            Change PIN
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!activeChild}
            onClick={() => {
               if (activeChild) {
                 router.push(`/chat/${activeChild.id}`)
               }
             }}
          >
            Kid's Mode
          </Button>
          <ModeToggle />
        </div>
      </header>

      {/* PIN Modal */}
      {isPinModalOpen && (
        <ChangePinModal
          personaId={dashboard.parent.id}
          onClose={() => setIsPinModalOpen(false)}
        />
      )}

      {/* Child Selector */}
      <ChildSelector
        children={dashboard.children}
        activeId={activeChild?.id ?? null}
        onChange={id =>
          setActiveChild(dashboard.children.find(c => c.id === id) || null)
        }
      />

      {/* Tabs */}
      <Tabs active={activeTab} onChange={setActiveTab} />

      {/* Main Content */}
      <div className="mt-6">
        {activeTab === 'controls' && activeChild && (
          <ParentalControls
            childId={activeChild.id}
            childName={activeChild.displayName}
          />
        )}

        {activeTab === 'reports' && activeChild && (
          <div className="space-y-8">
            <UsageReports  childId={activeChild.id} />
            <ChatSummaries childId={activeChild.id} />
          </div>
        )}

        {activeTab === 'account' && (
          <AccountManagement
            list={[
              { ...dashboard.parent, isParent: true },
              ...dashboard.children,
            ]}
            onEdit={onEditClick}
            onDelete={id => {
              const child = dashboard.children.find(c => c.id === id)
              if (child) setChildToDelete(child)
            }}
            onAdd={handleAddClick}
            onChangePin={() => setIsPinModalOpen(true)}
          />
        )}
      </div>

      {/* Add-Child Modal */}
      {addModalOpen && (
        <AddChildModal
          onClose={() => setAddModalOpen(false)}
          onCreated={handleChildCreated}
        />
      )}

      {/* Edit Profile Modal */}
      {editing && (
        <EditPersonaModal
          personaId={editing.id}
          currentName={editing.name}
          currentAvatar={editing.avatar}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!childToDelete} onOpenChange={open => !open && setChildToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete ${childToDelete?.displayName}'s profile? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
