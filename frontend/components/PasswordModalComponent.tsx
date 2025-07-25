'use client'

import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'

interface PasswordModalProps {
  open: boolean
  onClose: () => void
  id: string
}

interface Errors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

const PasswordModalComponent: React.FC<PasswordModalProps> = ({
  open,
  onClose,
  id,
}) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = (): boolean => {
    const formErrors: Errors = {}

    if (!currentPassword) {
      formErrors.currentPassword = 'Current password is required.'
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/

    if (!strongPasswordRegex.test(newPassword)) {
      formErrors.newPassword =
        'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.'
    }

      if (newPassword === currentPassword) {
    formErrors.newPassword =
      'New password cannot be the same as the current password.'
  }

    if (newPassword !== confirmPassword) {
      formErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(formErrors)
    return Object.keys(formErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/users/change-password`,
        {
          userId: id,
          oldPassword: currentPassword,
          newPassword,
        }
      )

      if (response.status === 200) {
        toast.success(response.data.message || 'Password updated successfully.')
        onClose()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    }
  }

  const PasswordInput = ({
    label,
    value,
    onChange,
    show,
    toggleShow,
    error,
    name,
  }: {
    label: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    show: boolean
    toggleShow: () => void
    error?: string
    name: string
  }) => (
    <div className='mb-4'>
      <Label htmlFor={name} className='text-sm font-medium'>
        {label}
      </Label>
      <div className='relative mt-1'>
        <Input
          type={show ? 'text' : 'password'}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={error ? 'border-red-500 pr-10' : 'pr-10'}
        />
        <button
          type='button'
          onClick={toggleShow}
          className='absolute inset-y-0 right-3 flex items-center text-gray-600'
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className='text-red-500 text-xs mt-1'>{error}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='w-[420px] rounded-xl'>
        <DialogHeader>
          <DialogTitle className='text-2xl text-[#031F3A] font-semibold'>
            Change Password
          </DialogTitle>
          <DialogDescription className='text-[11px] text-[#AFAFAF]'>
            Make sure you remember the password to log in. Your new password
            must be different from previously used passwords.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <PasswordInput
            label='Current Password'
            name='currentPassword'
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            show={showCurrentPassword}
            toggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
            error={errors.currentPassword}
          />

          <PasswordInput
            label='New Password'
            name='newPassword'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            show={showNewPassword}
            toggleShow={() => setShowNewPassword(!showNewPassword)}
            error={errors.newPassword}
          />

          <PasswordInput
            label='Confirm Password'
            name='confirmPassword'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            show={showConfirmPassword}
            toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            error={errors.confirmPassword}
          />

          <DialogFooter className='mt-4 flex justify-end gap-4'>
            <Button
              type='button'
              variant='cancel'
              onClick={onClose}
              className='rounded-xl shadow-[0px_3px_6px_#031F3A59]'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='teal'
              className='rounded-xl shadow-[0px_3px_6px_#031F3A59] text-base'
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PasswordModalComponent
