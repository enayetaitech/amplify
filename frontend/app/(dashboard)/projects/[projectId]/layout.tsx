'use client'

import { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { IProject } from '@shared/interface/ProjectInterface'

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const { projectId } = useParams()

  const { data: project, isLoading } = useQuery<IProject, Error>({
    queryKey: ['project', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })


  return (
    <div className="px-6 py-4">
      {isLoading ? (
        <h1 className="text-xl font-semibold">Loading…</h1>
      ) : (
        <h1 className="text-2xl font-bold">{project?.name}</h1>
      )}

      {/* this is where Sessions / Polls / Reports pages will render */}
      <div className="mt-6">{children}</div>
    </div>
  )
}
