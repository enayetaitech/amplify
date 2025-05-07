'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {ISessionDeliverable} from "@shared/interface/SessionDeliverableInterface"

const SessionDeliverables = () => {
  const { projectId } = useParams()

  const { data: sessionDeliverables, isLoading, error } = useQuery<ISessionDeliverable[], Error>({
    queryKey: ['sessionDeliverables', projectId],
    queryFn: () =>
      api
        .get(
          `/api/v1/sessionDeliverables/project/${projectId}?type=TRANSCRIPT`
        )
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

  console.log("sessionDeliverables", sessionDeliverables)

  if (isLoading) return <p>Loading session deliverables…</p>
  if (error) return <p className="text-red-500">Error: {error.message}</p>

  return (
    <div>SessionDeliverables</div>
  )
}

export default SessionDeliverables