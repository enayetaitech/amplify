'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {IObserverDocument} from "@shared/interface/ObserverDocumentInterface"

const ObserverDocuments = () => {
  const { projectId } = useParams()

  const { data: observerDocuments, isLoading, error } = useQuery<IObserverDocument[], Error>({
    queryKey: ['observerDocs', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/observerDocuments/project/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

  console.log("observerDocuments", observerDocuments)
  
  if (isLoading) return <p>Loading observer documents…</p>
  if (error) return <p className="text-red-500">Error: {error.message}</p>


  return (
    <div>ObserverDocuments</div>
  )
}

export default ObserverDocuments