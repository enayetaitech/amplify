'use client'

import * as React from 'react'
import { BiSolidErrorAlt } from 'react-icons/bi'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface InputFieldProps {
  label: string
  type?: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
  icon?: React.ReactNode
  emailSuccess?: boolean
  disabled?: boolean
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  icon,
  emailSuccess,
  disabled = false,
}) => {
  return (
    <div className='mb-4'>
      <Label
        htmlFor={name}
        className='block text-sm font-semibold text-black mb-2'
      >
        {label}
      </Label>
      <div className='relative'>
        <Input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-10 ${error ? 'border-custom-red' : 'border-black'}`}
        />
        {icon && (
          <span className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5'>
            {icon}
          </span>
        )}
      </div>
      {error && (
        <div className='flex items-start gap-1 mt-2 text-sm text-custom-red'>
          <BiSolidErrorAlt className='mt-0.5' />
          <p className='text-xs'>{error}</p>
        </div>
      )}
      {emailSuccess && (
        <div className='flex items-start gap-1 mt-2 text-sm text-custom-green'>
          <BiSolidErrorAlt className='mt-0.5' />
          <p className='text-xs'>Your Email is available.</p>
        </div>
      )}
    </div>
  )
}

export default InputField
