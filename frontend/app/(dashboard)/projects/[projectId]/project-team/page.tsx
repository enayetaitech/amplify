'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {IModerator} from "@shared/interface/ModeratorInterface"


const ProjectTeam = () => {
  const { projectId } = useParams()

  const { data: projectTeam, isLoading, error } = useQuery<IModerator[], Error>({
    queryKey: ['projectTeam', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/moderators/project/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

  console.log("projectTeam", projectTeam)

  if (isLoading) return <p>Loading project team…</p>
  
  if (error) return <p className="text-red-500">Error: {error.message}</p>

  return (
    <div>ProjectTeam</div>
  )
}

export default ProjectTeam