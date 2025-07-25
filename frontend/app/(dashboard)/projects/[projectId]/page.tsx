'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { IProject } from '@shared/interface/ProjectInterface'
import api from 'lib/api'


export default function ProjectOverviewPage() {
  const { projectId } = useParams()
  const { data: project, isLoading, error } = useQuery<IProject, Error>({
    queryKey: ['project', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-id/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })


  if (isLoading) return <p>Loading project overview…</p>
  if (error) return <p className="text-red-500">Failed to load project.</p>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">About this project</h2>
      <p>{project?.name || 'No description provided.'}</p>
     
    </div>
  )
}
