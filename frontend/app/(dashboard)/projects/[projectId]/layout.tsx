'use client'

import { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useProject } from 'hooks/useProject'

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const { projectId } = useParams() as { projectId: string };

  const { data: project, isLoading } = useProject(projectId)

  return (
    <div className=" py-4 px-5">
      {isLoading ? (
        <h1 className="text-xl font-semibold pl-16">Loading Project Name…</h1>
      ) : (
        <h1 className="text-2xl font-bold">{project?.name}</h1>
      )}

      {/* this is where Sessions / Polls / Reports pages will render */}
      <div className="mt-6">{children}</div>
    </div>
  )
}
