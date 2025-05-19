'use client'

import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pie, PieChart } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

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

// Define chart colors using CSS variables
const chartConfig = {
  value: {
    label: "Topics",
  },
  "Maurya Dynasty": {
    label: "Maurya Dynasty",
    color: "hsl(var(--chart-1))",
  },
  "Chandragupta Maurya": {
    label: "Chandragupta Maurya",
    color: "hsl(var(--chart-2))",
  },
  "Buddhism": {
    label: "Buddhism",
    color: "hsl(var(--chart-3))",
  },
  "Ashoka": {
    label: "Ashoka",
    color: "hsl(var(--chart-4))",
  },
  "Peace and Kindness": {
    label: "Peace and Kindness",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

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

  if (loading) return (
    <div className="space-y-6">
      {/* Skeleton Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>

      {/* Skeleton Card */}
      <Card>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Metrics grid skeletons */}
          <div className="grid grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 flex flex-col items-center"
              >
                <Skeleton className="h-10 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>

          {/* Donut chart skeleton */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-40 h-40">
              <Skeleton className="h-40 w-40 rounded-full" />
              <Skeleton className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-background" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  if (error) return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <Button 
          className="mt-4" 
          onClick={() => {
            setLoading(true)
            const today = new Date().toISOString().slice(0,10)
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
          }}
        >
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
  
  if (!data) return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-gray-600 dark:text-gray-500 mb-2">No data available</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Usage data will appear here once available</p>
        </div>
      </CardContent>
    </Card>
  )

  const { usage, favoriteTopics } = data
  const pieData = favoriteTopics.map(t => ({ 
    name: t.topicName, 
    value: t.percentage,
    fill: `hsl(var(--chart-${Math.floor(Math.random() * 5) + 1}))` // Random color from chart variables
  }))
  console.log('pieData', pieData)

  return (
    <div className="space-y-6">
      {/* HEADER outside card */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Today's Usage Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Summary of {childName}'s activities today
          </p>
        </div>
      </div>

      {/* CARD WITH METRICS & DONUT */}
      <Card>
        <CardContent className="p-8 flex md:flex-row flex-col items-center gap-8">
          {/* Metrics grid */}
          <div className="grid md:grid-cols-3 gap-4 w-full">
            {[
              { label: 'Total Messages',  value: usage.totalMessages, color: 'text-indigo-500' },
              { label: 'Flagged Words',   value: usage.flaggedWords,   color: 'text-red-500' },
              { label: 'Topics Explored', value: usage.topicsExplored, color: 'text-green-500' },
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

          {/* Updated Pie Chart */}
          <div className="flex flex-col w-full">
            <CardHeader className="items-center pb-0">
              <CardTitle className="text-xl font-semibold">Topics Explored</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              {pieData.length > 0 ? (
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie 
                      data={pieData} 
                      dataKey="value" 
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={4}
                    />
                  </PieChart>
                </ChartContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No topics yet</p>
              )}
            </CardContent>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}