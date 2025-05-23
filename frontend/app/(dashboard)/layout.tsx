'use client'
import React, { ReactNode, useEffect, useState } from 'react'
import { useGlobalContext } from '../../context/GlobalContext'
import { useRouter } from 'next/navigation'
import FooterComponent from 'components/FooterComponent'
import DashboardSidebarComponent from '../../components/DashboardSidebarComponent'
import LogoutModalComponent from 'components/LogoutModalComponent'

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const { user } = useGlobalContext()
  const router = useRouter()

  const handleLogoutModalOpen = () => {
    setIsLogoutModalOpen(!isLogoutModalOpen)
  }

  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false)
  }

  useEffect(() => {
    if (!user || Object.keys(user).length === 0) {
      router.push('/login')
    }
  }, [user, router])

  return (
    <div className='min-h-screen flex flex-col h-full'>
      {/* upper layout */}
      <div className='flex-grow h-full flex relative'>
        <div className='sticky top-0 md:w-[260px] h-screen z-10'>
          <DashboardSidebarComponent
            handleLogoutModalOpen={handleLogoutModalOpen}
            // isLogoutModalOpen={isLogoutModalOpen}
            
          />
        </div>
        <div className='overflow-x-hidden flex-grow h-full'>{children}</div>
      </div>

      {/* logout modal */}
      {isLogoutModalOpen && (
        <LogoutModalComponent
          open={isLogoutModalOpen}
          onClose={handleCloseLogoutModal}
        />
      )}

      {/* footer */}
      <FooterComponent />
    </div>
  )
}
export default DashboardLayout
