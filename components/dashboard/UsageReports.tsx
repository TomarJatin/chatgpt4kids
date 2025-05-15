'use client'

import React, { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface Usage {
  totalMessages: number
  flaggedWords: number
  topicsExplored: number
  newSubjects: number
}

interface FavoriteTopic {
  topicName: string
  percentage: number
}

interface AnalyticsPayload {
  date: string
  usage: Usage
  favoriteTopics: FavoriteTopic[]
}

interface Props {
  childId: string
}

const COLORS = ['#7C5AFF', '#FFA5A5', '#67D7F9', '#F9D667']

export default function UsageReports({ childId }: Props) {
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/parent/analytics/${childId}?date=${today}`, {
      credentials: 'include',
    })
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

  if (loading) return <p className="text-gray-900 dark:text-gray-100">Loading usage…</p>
  if (error)   return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!data)   return null

  const { usage, favoriteTopics } = data
  const pieData = favoriteTopics.map(t => ({ name: t.topicName, value: t.percentage }))

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">
          Today’s Usage Report
        </CardTitle>
        <CardDescription className="text-gray-700 dark:text-gray-300">
          Summary of activities today
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Messages',  value: usage.totalMessages },
            { label: 'Flagged Words',   value: usage.flaggedWords   },
            { label: 'Topics Explored', value: usage.topicsExplored },
            { label: 'New Subjects',    value: usage.newSubjects    },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col items-center"
            >
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {item.value}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <Separator className="dark:border-gray-700" />

        {/* Chart + List */}
        <div className="md:flex md:items-center md:space-x-8">
          {/* Pie Chart */}
          <div className="md:w-1/2 h-64">
            <ResponsiveContainer>
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
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={value => (
                    <span className="text-gray-900 dark:text-gray-100 text-sm">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Topics List */}
          <div className="md:w-1/2 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Topics Discussed
            </h3>
            <ul className="space-y-2">
              {favoriteTopics.map((t, i) => (
                <li
                  key={i}
                  className="flex justify-between text-sm text-gray-700 dark:text-gray-200"
                >
                  <span>{t.topicName}</span>
                  <Badge variant="secondary">{t.percentage}%</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
