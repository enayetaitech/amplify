'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {ISession} from "@shared/interface/SessionInterface"

const Sessions = () => {
  const { projectId } = useParams()

  const { data: sessions, isLoading, error } = useQuery<ISession[], Error>({
    queryKey: ['sessions', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/sessions/project/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

  console.log('Sessions', sessions)

  if (isLoading) return <p>Loading sessions…</p>
  if (error) return <p className="text-red-500">Error: {error.message}</p>

  return (
    <div>Sessions</div>
  )
}

export default Sessions