'use client'
import { useGlobalContext } from 'context/GlobalContext'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import api from 'lib/api'

interface LogoutModalProps {
  open: boolean
  onClose: () => void
}

const LogoutModalComponent: React.FC<LogoutModalProps> = ({
  open,
  onClose,
}) => {
  const { setUser } = useGlobalContext()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/users/logout")
      localStorage.clear()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if server request fails
      localStorage.clear()
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='rounded-2xl w-[420px]'>
        <DialogHeader>
          <DialogTitle className='text-[#031F3A] text-2xl'>Log Out</DialogTitle>
          <DialogDescription className='text-[#AFAFAF] text-[11px]'>
            Are you sure you want to logout?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='gap-4 sm:justify-end mt-8'>
          <Button
            variant='dark-blue'
            type='button'
            onClick={onClose}
            className='rounded-xl py-1 px-7 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Cancel
          </Button>
          <Button
            variant='teal'
            type='button'
            onClick={handleLogout}
            className='rounded-xl py-1 px-10 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LogoutModalComponent
