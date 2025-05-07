'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {IPoll} from "@shared/interface/PollInterface"

const Polls = () => {
  const { projectId } = useParams()

  const { data: polls, isLoading, error } = useQuery<IPoll[], Error>({
    queryKey: ['polls', projectId],
    queryFn: () =>
      api.get(`/api/v1/polls/project/${projectId}`).then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

console.log("polls", polls)

  if (isLoading) return <p>Loading polls…</p>
  if (error) return <p className="text-red-500">Error: {error.message}</p>


  return (
    <div>Polls</div>
  )
}

export default Polls