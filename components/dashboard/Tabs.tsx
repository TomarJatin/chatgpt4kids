'use client'

import * as React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Cog6ToothIcon,
  ChartPieIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

interface Props {
  active: 'controls' | 'reports' | 'account'
  onChange: (tab: 'controls' | 'reports' | 'account') => void
}

export default function DashboardTabs({ active, onChange }: Props) {
  return (
    <Tabs
      value={active}
      onValueChange={(val: string) => onChange(val as any)}
      className="w-full"
    >
      <TabsList className="grid grid-cols-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { value: 'controls', icon: Cog6ToothIcon, label: 'Parental Controls' },
          { value: 'reports',  icon: ChartPieIcon,   label: 'Reports'           },
          { value: 'account',  icon: UserCircleIcon, label: 'Account Management'},
        ].map(({ value, icon: Icon, label }) => (
          <TabsTrigger
            key={value}
            value={value}
            className={`
              flex items-center justify-center gap-2
              text-gray-600 dark:text-gray-400
              data-[state=active]:bg-white
              dark:data-[state=active]:bg-gray-900
              data-[state=active]:text-gray-900
              dark:data-[state=active]:text-white
              data-[state=active]:shadow
            `}
          >
            <Icon className="w-5 h-5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
