'use client'
import React, { useState, useEffect, ChangeEvent } from 'react'

import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaSave } from 'react-icons/fa'
import { toast } from 'sonner'
import { useGlobalContext } from 'context/GlobalContext'
import { Button } from 'components/ui/button'
import InputFieldComponent from 'components/InputFieldComponent'
import { EditUser, IUser } from '@shared/interface/UserInterface'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiResponse, ErrorResponse } from '@shared/interface/ApiResponseInterface'
import api from 'lib/api'

const Page: React.FC = () => {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { setUser: setGlobalUser } = useGlobalContext()

   const [formState, setFormState] = useState<EditUser>({
    firstName: '',
    lastName: '',
    email: '',
  })

    // 1️⃣ Load the user data
    const {
      data: fullUser,
      isLoading,
      isError,
      error,
    } = useQuery<IUser, ErrorResponse>({
      queryKey: ['user', id],
      queryFn: () =>
        api
          .get<ApiResponse<IUser>>('/api/v1/users/find-by-id', { params: { id } })
          .then(res => res.data.data),
    })

    useEffect(() => {
      if (fullUser) {
        setFormState({
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          email: fullUser.email,
        })
      }
    }, [fullUser])

  

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const updateMutation = useMutation<IUser, ErrorResponse, EditUser>({
    
    mutationFn: (updatedFields: EditUser) =>
      api
        .put<ApiResponse<IUser>>(`/api/v1/users/edit/${id}`, updatedFields)
        .then(res => res.data.data),

    onSuccess: (updatedUser: IUser) => {
      setGlobalUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      toast.success('Profile updated successfully')
      router.push(`/my-profile/${id}`)
    },

    onError: (err: ErrorResponse) => {
      console.error('Error updating profile:', err)
      toast.error(err.message || 'Failed to update profile')
    },
  })



  const handleSave = () => {
    updateMutation.mutate(formState)
  }

  if (isLoading) return <p className="px-6 py-4">Loading profile…</p>

  if (isError) {
    console.error('Error fetching user:', error)
    return <p className="px-6 py-4 text-red-500">{error?.message || 'Failed to load profile'}</p>
  }

  

  return (
    <div className='my_profile_main_section_shadow pb-16 bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex flex-col items-center'>
      {/* navbar */}
      <div className='bg-white h-20 w-full'>
        <div className='px-10 flex justify-between items-center pt-3'>
          <div className='flex justify-center items-center w-full'>
            <p className='text-2xl font-bold text-[#1E656D] text-center'>
              Edit Profile
            </p>
          </div>
          <div className=' justify-center items-center gap-4 hidden md:flex'>
            <Button
              type='button'
              variant='teal'
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className='rounded-xl w-[100px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]'
            >
              <FaSave />
             {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
          <div className='flex justify-center items-center gap-4 md:hidden fixed right-5'>
            <Button
              type='button'
              variant='teal'
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className='rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#FF66004D] '
            >
              <FaSave />
            </Button>
          </div>
        </div>
      </div>

      {/* body */}
      <div className='w-full md:w-[450px] px-5 md:px-0 md:ml-6 md:mr-auto'>
        <div className='pt-8 w-full'>
          <div className='flex justify-start items-center gap-8 flex-col md:flex-row'>
            <Image
              src='/placeholder-image.png'
              alt='user image'
              height={70}
              width={70}
              className='rounded-full'
            />
            <div className='flex-grow'>
              <h1 className='text-3xl font-semibold text-[#1E656D] text-center md:text-left'>
              {formState.firstName} {formState.lastName}
              </h1>
              <p className='text-center text-gray-400 md:text-left'>
              {formState.role}
              </p>
            </div>
          </div>

          {/* personal details */}
          <div>
            <h1 className='text-2xl font-semibold text-[#00293C] pt-7 md:text-left'>
              Personal Details
            </h1>
            <div className='space-y-7 pt-0 md:pt-7 mt-5'>
              <InputFieldComponent
                label='First Name'
                name='firstName'
                value={formState?.firstName}
                onChange={handleInputChange}
              />
              <InputFieldComponent
                label='Last Name'
                name='lastName'
                value={formState?.lastName}
                onChange={handleInputChange}
              />
              <InputFieldComponent
                label='Email'
                name='email'
                value={formState?.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
