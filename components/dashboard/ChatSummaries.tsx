
'use client'

import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

type AnalyticsPayload = {
  date: string
  usage: { totalMessages: number }
  favoriteTopics: { topicName: string; percentage: number }[]
  educationalSuggestions: string[]
  chatSummary: string
  flaggedWords: string[]
  interests:    string[]
}

interface Props {
  childId: string
}

export default function ChatSummaries({ childId }: Props) {
  const [data, setData]       = useState<AnalyticsPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [date, setDate]       = useState<string>(new Date().toISOString().slice(0,10))

  useEffect(() => {
    console.log('[ChatSummaries] Fetching for date:', date)
    setLoading(true)
    fetch(`/api/parent/analytics/${childId}?date=${date}`, { credentials: 'include' })
      .then(res => {
        console.log('[ChatSummaries] HTTP status:', res.status)
        if (!res.ok) throw new Error('Failed to load summaries')
        return res.json() as Promise<AnalyticsPayload>
      })
      .then(payload => {
        console.log('[ChatSummaries] payload:', payload)
        setData([payload])
        setError(null)
      })
      .catch(err => {
        console.error('[ChatSummaries] error:', err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [childId, date])

  // log the component's render state
  console.log('[ChatSummaries] state → loading:', loading, 'error:', error, 'data:', data)

  if (loading) return <p className="text-gray-900 dark:text-gray-100">Loading summaries…</p>
  if (error)   return <p className="text-red-600 dark:text-red-400">{error}</p>
  if (!data.length) return <p className="text-gray-700">No data for {date}</p>


  return (
    <div className="space-y-8">
      {/* Header with Date Picker */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Chat Summaries
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Daily summaries of your child's conversations
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              {format(new Date(date), 'yyyy-MM-dd')}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(date)}
              onSelect={d => d && setDate(format(d, 'yyyy-MM-dd'))}
            />
          </PopoverContent>
        </Popover>
      </div>

      {data.map((day, i) => (
        <Card key={i}>
          <CardContent className="space-y-6 mt-6">
            {/* Date */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {format(new Date(day.date), 'EEEE, MMMM d, yyyy')}
            </h3>

            {/* ← One-line summary */}
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {day.chatSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity Overview */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Activity Overview
                </h4>
                <div className="flex justify-between">
                  <span className="text-gray-800 dark:text-gray-200">Total Messages</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {day.usage.totalMessages}
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="text-gray-800 dark:text-gray-200">Top Topics</span>
                  <div className="flex flex-wrap gap-2">
                    {day.favoriteTopics.slice(0, 3).map((t, idx) => (
                      <Badge key={idx}>{t.topicName}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="text-gray-800 dark:text-gray-200">Interests</span>
                  <div className="flex flex-wrap gap-2">
                    {day.interests.map((int, idx) => (
                      <Badge key={idx}>{int}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="text-gray-800 dark:text-gray-200">Flagged Words</span>
                  <div className="flex flex-wrap gap-2">
                    {day.flaggedWords.length > 0 ? (
                      day.flaggedWords.map((w, idx) => (
                        <Badge key={idx} variant="destructive">
                          {w}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Recommendations
                </h4>
                <Separator />
                <p className="text-gray-800 dark:text-gray-200">
                  Suggested Topics to explore:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-800 dark:text-gray-200">
                  {day.educationalSuggestions.map((topic, idx) => (
                    <li key={idx}>{topic}</li>
                  ))}
                </ul>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Based on today’s conversations, your child showed interest in{' '}
                  {day.favoriteTopics.slice(0, 2).map(t => t.topicName).join(' and ')}.
                  Consider exploring these topics together!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
