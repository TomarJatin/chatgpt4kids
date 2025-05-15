'use client'

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

type Child = { id: string; displayName: string; avatar: string | null }

interface Props {
  children: Child[]
  activeId?: string | null
  onChange: (id: string) => void
}

export default function ChildSelector({ children, activeId, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      value={activeId ?? ''}
      onValueChange={val => val && onChange(val)}
      className="flex space-x-4 mb-6"
    >
      {children.map(c => (
        <ToggleGroupItem
          key={c.id}
          value={c.id}
          className={cn(
            'w-12 h-12 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2',
            activeId === c.id
              ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-white dark:bg-gray-800'
              : 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          <Avatar>
            {c.avatar ? (
              <AvatarImage src={c.avatar} alt={c.displayName} />
            ) : (
              <AvatarFallback>
                {c.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
