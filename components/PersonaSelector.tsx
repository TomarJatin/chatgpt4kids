'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'

export type Persona = {
  id: string
  displayName: string
  avatar: string | null
  type: 'parent' | 'child'
}

interface Props {
  personas: Persona[]
  onSelect: (p: Persona) => void
  onAdd: () => void
}

export default function PersonaSelector({ personas, onSelect, onAdd }: Props) {
  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
      {/* <CardHeader className="pb-0">
        <CardTitle className="text-3xl text-center text-gray-800 dark:text-gray-100">
          Select Persona
        </CardTitle>
      </CardHeader> */}
      <CardContent className="mt-6 flex justify-evenly items-center space-x-12">
        {personas.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="group flex flex-col items-center focus:outline-none"
          >
            <div className="relative">
              <Avatar className="w-28 h-28 bg-white dark:bg-gray-700 rounded-full shadow-lg ring-2 ring-indigo-400 group-hover:ring-indigo-500 transition-all duration-300 transform group-hover:scale-105">
                {p.avatar ? (
                  <AvatarImage src={p.avatar} alt={p.displayName} />
                ) : (
                  <AvatarFallback className="text-xl font-semibold text-gray-700 dark:text-gray-200 uppercase">
                    {p.displayName.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              {p.type === 'parent' && (
                <Badge className="absolute -bottom-2 right-0 bg-violet-500 text-white shadow-md">
                  Parent
                </Badge>
              )}
            </div>
            <span className="mt-4 text-lg font-medium text-gray-800 dark:text-gray-100 transition-colors group-hover:text-indigo-500">
              {p.displayName}
            </span>
          </button>
        ))}

        <button
          onClick={onAdd}
          className="group flex flex-col items-center focus:outline-none"
        >
          <Avatar className="w-28 h-28 bg-gray-100 dark:bg-gray-700 rounded-full shadow-lg ring-2 ring-gray-300 group-hover:ring-indigo-500 transition-all duration-300 transform group-hover:scale-105">
            <AvatarFallback>
              <PlusIcon className="w-10 h-10 text-gray-500 dark:text-gray-300" />
            </AvatarFallback>
          </Avatar>
          <span className="mt-4 text-lg font-medium text-gray-800 dark:text-gray-100 transition-colors group-hover:text-indigo-500">
            Add Profile
          </span>
        </button>
      </CardContent>
    </Card>
  )
}
