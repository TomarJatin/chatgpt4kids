'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PencilIcon, TrashIcon, LockClosedIcon, UserCircleIcon } from '@heroicons/react/24/outline'

interface PersonaInfo {
  id: string
  displayName: string
  avatar: string | null
  isParent?: boolean
}

interface Props {
  list: PersonaInfo[]
  onEdit: (id: string, currentName: string, currentAvatar: string | null) => void
  onDelete: (id: string) => void
  onAdd: () => void
  onChangePin: () => void
}

export default function AccountManagement({
  list,
  onEdit,
  onDelete,
  onAdd,
  onChangePin,
}: Props) {
  return (
    <Card >
      <CardContent className="space-y-6 mt-6">
        <ul className="space-y-4">
          {list.map(person => (
            <li key={person.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  {person.avatar ? (
                    <AvatarImage src={person.avatar} alt={person.displayName} />
                  ) : (
                    <AvatarFallback>
                      <UserCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {person.displayName}{person.isParent ? ' (Parent)' : ''}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(person.id, person.displayName, person.avatar)}
                >
                  <PencilIcon className="h-5 w-5" />
                </Button>

                {!person.isParent && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(person.id)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </li>
          ))}

          <li>
            <Button variant="link" size="sm" onClick={onAdd}>
              + Add Child
            </Button>
          </li>
        </ul>

        <Separator />

        <Button variant="default" onClick={onChangePin}>
          <LockClosedIcon className="h-5 w-5 mr-2" />
          Change PIN
        </Button>
      </CardContent>
    </Card>
  )
}
