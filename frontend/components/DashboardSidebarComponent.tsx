'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Logo from './LogoComponent'
import { FaBars, FaListAlt, FaUserClock } from 'react-icons/fa'
import { MdOutlineInsertChart } from 'react-icons/md'
import { AiOutlineClose } from 'react-icons/ai'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { ChevronDown, ChevronUp, CircleUser, FileText, UserPen } from 'lucide-react'
import { IoIosLogOut } from 'react-icons/io'
import { IProject } from '@shared/interface/ProjectInterface'
import api from 'lib/api'
import { useGlobalContext } from 'context/GlobalContext'

export default function DashboardSidebarComponent({
  handleLogoutModalOpen,
}: {
  handleLogoutModalOpen: () => void
}) {
  const pathname = usePathname()!
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user } = useGlobalContext()
  const [acctOpen, setAcctOpen] = useState(false)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)

  // fetch only this user's projects
  const userId = user?._id
  const { data: projects = [] } = useQuery<IProject[], Error>({
    queryKey: ['projectsByUser', userId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-userId/${userId}`)
        .then((r) => r.data.data),
    staleTime: 300_000,
    enabled: Boolean(userId),
  })

  // detect active project in URL
  const segments = pathname.split('/').filter(Boolean)
  const pIdx = segments.indexOf('projects')
  const projectId = (pIdx > -1 && segments.length > pIdx + 1) ? segments[pIdx + 1] : null

  // toggle projects list
  const [showProjects, setShowProjects] = useState(
    pathname.startsWith('/projects')
  )

  // sub-nav for the active project
  const projectSubNav = projectId
    ? [
        { label: 'Sessions', href: `/projects/${projectId}/sessions` },
        { label: 'Session Deliverables', href: `/projects/${projectId}/session-deliverables` },
        { label: 'Observer Documents', href: `/projects/${projectId}/observer-documents` },
        { label: 'Project Team', href: `/projects/${projectId}/project-team` },
        { label: 'Polls', href: `/projects/${projectId}/polls` },
        { label: 'Reports', href: `/projects/${projectId}/reports` },
      ]
    : []

  // close account dropdown and logout dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLogoutMenu(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <FaBars
          className="text-2xl cursor-pointer"
          onClick={() => setMobileOpen(v => !v)}
        />
      </div>

      <aside className={`
        flex flex-col fixed md:relative top-0 left-0 h-screen w-64 z-40
        bg-white shadow transform transition-transform
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close */}
        <div className="md:hidden absolute top-4 right-4">
          <AiOutlineClose
            className="text-2xl cursor-pointer"
            onClick={() => setMobileOpen(false)}
          />
        </div>

        {/* Logo */}
        <div className="py-8 px-6"><Logo /></div>

        {/* Main nav */}
        <nav className="px-6 flex-1 overflow-auto">
          {/* Projects header */}
          <div
            className={`
              flex items-center justify-between w-full gap-3 py-2 font-semibold cursor-pointer
              ${pathname.startsWith('/projects')
                ? 'text-blue-600'
                : 'text-gray-700 hover:text-gray-900'
              }
            `}
            onClick={() => {
              router.push('/projects')
              setShowProjects(v => !v)
            }}
          >
            <div className="flex items-center gap-3">
              <FaListAlt /><span>Projects</span>
            </div>
            {showProjects ? <ChevronUp /> : <ChevronDown />}
          </div>

          {/* List projects with nested sub-menu under active one */}
          {showProjects && (
            <ul className="ml-6 mt-2 space-y-1">
              {projects.map(p => {
                const href = `/projects/${p._id}`
                const active = pathname.startsWith(href)
                return (
                  <React.Fragment key={p._id}>
                    <li>
                      <Link
                        href={href}
                        className={`block py-1 ${
                          active
                            ? 'text-blue-500 font-medium'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        {p.name}
                      </Link>
                    </li>

                    {active && projectSubNav.length > 0 && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {projectSubNav.map(it => (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              className={`block py-1 ${
                                pathname === it.href
                                  ? 'text-blue-400 underline'
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              {it.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </React.Fragment>
                )
              })}
            </ul>
          )}

          {/* Other static links */}
          <div className="mt-8 space-y-4">
            <Link href="/observers">
              <div className="flex items-center gap-3">
                <FaUserClock /><span>Observers</span>
              </div>
            </Link>

            {/* Account submenu */}
            <div
              className="flex flex-col gap-1 cursor-pointer"
              onClick={() => setAcctOpen(v => !v)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CircleUser /><span>Account</span>
                </div>
                {acctOpen ? <ChevronUp /> : <ChevronDown />}
              </div>
              {acctOpen && (
                <div ref={modalRef} className="pl-8 mt-2 space-y-2">
                  <Link href={`/my-profile/${user?._id}`} className="flex items-center gap-2">
                    <UserPen /> Profile
                  </Link>
                  <Link href="/payment" className="flex items-center gap-2">
                    <FileText /> Billing
                  </Link>
                </div>
              )}
            </div>

            {user?.role === 'AmplifyAdmin' && (
              <>
                <Link href="/external-admins">
                  <div className="flex items-center gap-3">
                    <FaUserClock /><span>External Admins</span>
                  </div>
                </Link>
                <Link href="/internal-admins">
                  <div className="flex items-center gap-3">
                    <FaUserClock /><span>Internal Admins</span>
                  </div>
                </Link>
                <Link href="/companies">
                  <div className="flex items-center gap-3">
                    <MdOutlineInsertChart /><span>Companies</span>
                  </div>
                </Link>
              </>
            )}
          </div>
        </nav>

       {/* User info pinned to bottom */}
<div className="px-6 mt-auto pb-6">
  <div className="relative flex items-center justify-between p-3 bg-gray-100 rounded-lg overflow-visible">
    {/* Left side: avatar + names */}
    <div className="flex items-center gap-3">
      <Image
        src="/user.jpg"
        alt="avatar"
        width={36}
        height={36}
        className="rounded-full"
      />
      <div className="text-sm">
        <p className="font-semibold truncate">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-xs text-gray-600 truncate w-40">{user?.email}</p>
      </div>
    </div>

    {/* Right side: three-dots */}
    <button
      className="p-1 cursor-pointer"
      onClick={() => setShowLogoutMenu((v) => !v)}
    >
      <BsThreeDotsVertical size={20} />
    </button>

    {/* Logout pop-over */}
    {showLogoutMenu && (
      <div
        ref={menuRef}
        className="absolute bottom-full right-0 mt-2 w-36 bg-white border rounded shadow-lg z-50"
      >
        <button
          className="flex items-center w-full px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            setShowLogoutMenu(false)
            handleLogoutModalOpen()
          }}
        >
          <IoIosLogOut className="mr-2" /> Logout
        </button>
      </div>
    )}
  </div>
</div>

    </aside>
    </>
  )
}
