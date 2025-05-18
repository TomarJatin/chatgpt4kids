'use client'

import React, { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface AnalyticsPayload {
  date: string
  usage: {
    totalMessages: number
    flaggedWords:   number
    topicsExplored: number
    newSubjects:    number
  }
  favoriteTopics: { topicName: string; percentage: number }[]
}

interface Props {
  childId: string
  childName: string
  childAvatarUrl: string | null
}

const COLORS = ['#7C5AFF', '#FFA5A5', '#67D7F9', '#F9D667']

export default function UsageReports({ childId, childName, childAvatarUrl }: Props) {
  const [data, setData]       = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().slice(0,10)
    setLoading(true)
    fetch(`/api/parent/analytics/${childId}?date=${today}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load usage report')
        return res.json() as Promise<AnalyticsPayload>
      })
      .then(payload => {
        setData(payload)
        setError(null)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [childId])

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading…</p>
  if (error)   return <p className="text-destructive">{error}</p>
  if (!data)   return <p className="text-gray-600 dark:text-gray-500">No data</p>

  const { usage, favoriteTopics } = data
  const pieData = favoriteTopics.map(t => ({ name: t.topicName, value: t.percentage }))

  return (
    <div className="space-y-6">
      {/* HEADER outside card */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Today’s Usage Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Summary of {childName}’s activities today
          </p>
        </div>
        {/* <div className="flex items-center space-x-2">
          <Avatar className="h-10 w-10">
            {childAvatarUrl ? (
              <AvatarImage src={childAvatarUrl} alt={childName} />
            ) : (
              <AvatarFallback>{childName[0]}</AvatarFallback>
            )}
          </Avatar>
          <span className="text-gray-900 dark:text-white font-medium">
            {childName}
          </span>
        </div> */}
      </div>

      {/* CARD WITH METRICS & DONUT */}
      <Card>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Messages',  value: usage.totalMessages, color: 'text-indigo-500' },
              { label: 'Flagged Words',   value: usage.flaggedWords,   color: 'text-red-500' },
              { label: 'Topics Explored', value: usage.topicsExplored, color: 'text-green-500' },
              { label: 'New Subjects',    value: usage.newSubjects,    color: 'text-blue-500' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 flex flex-col items-center"
              >
                <p className={`text-4xl font-bold ${item.color}`}>
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Donut / placeholder */}
          <div className="flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={4}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No topics yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}