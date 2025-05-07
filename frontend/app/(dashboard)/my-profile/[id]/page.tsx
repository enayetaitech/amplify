'use client'

import React, {  useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from 'components/ui/button'
import PasswordModalComponent from 'components/PasswordModalComponent'
import ConfirmationModalComponent from 'components/ConfirmationModalComponent'
import { useGlobalContext } from 'context/GlobalContext'
import { RiPencilFill } from 'react-icons/ri'
import { IoTrashSharp } from 'react-icons/io5'
import { MdLockReset } from 'react-icons/md'
import HeadingParagraphComponent from 'components/HeadingParagraphComponent'
import { useMutation } from '@tanstack/react-query'
import { ApiResponse, ErrorResponse } from '@shared/interface/ApiResponseInterface'
import api from 'lib/api'

const Page = () => {
  const { user, setUser } = useGlobalContext()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()


  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

 

  // 🔄 Mutation: delete user account
  const deleteUserMutation = useMutation<void, ErrorResponse, string>({
    mutationFn: userId =>
      api.delete<ApiResponse<void>>(`/api/v1/users/${userId}`).then(res => res.data.data),
    onSuccess: () => {
      toast.success('Account deleted')
      setUser(null)
      router.push('/login')
    },
    onError: err => {
      toast.error(err.message || 'Failed to delete account')
    },
  })


  


  return (
    <>
      {/* Desktop View */}
      <div className='hidden md:flex my_profile_main_section_shadow bg-[#fafafb] bg-opacity-90 h-full min-h-screen  flex-col justify-center items-center relative'>
        <div className='bg-white h-24 w-full px-10 flex justify-between items-center pt-5'>
          <p className='text-2xl font-bold text-custom-teal'>My Profiles</p>
        </div>

        <div className='flex-grow w-full px-10 pt-14'>
          <div className='flex gap-8 items-center'>
            <Image
              src='/placeholder-image.png'
              alt='user image'
              height={70}
              width={70}
              className='rounded-full'
            />
            <div className='flex-grow'>
              <h1 className='text-3xl font-semibold text-custom-dark-blue-1'>
                {user ? user.firstName?.toUpperCase() : 'Loading...'}
              </h1>
              <p>{user ? user.role?.toUpperCase() : 'Loading...'}</p>
            </div>
          </div>

          <h1 className='text-2xl font-semibold text-custom-dark-blue-1 pt-14'>
            Personal Details
          </h1>
          <div className='space-y-7 pt-7'>
            <HeadingParagraphComponent
              heading='First Name'
              paragraph={user?.firstName?.toUpperCase() || ''}
            />
            <HeadingParagraphComponent
              heading='Last Name'
              paragraph={user?.lastName?.toUpperCase() || ''}
            />
            <HeadingParagraphComponent
              heading='Email'
              paragraph={user?.email ?? ''}
            />
            <HeadingParagraphComponent
              heading='Remaining Credits'
              paragraph={`${user?.credits ?? 0}`}
            />
          </div>
        </div>
        <div className='flex gap-4 justify-end items-center pb-10 w-full px-10'>
          <Link href={`/edit-profile/${id}`}>
            <Button
              type='button'
              variant='teal'
              className='rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]'
            >
              <RiPencilFill />
              Edit Profile
            </Button>
          </Link>
          <Button
            type='button'
            variant='dark-blue'
            onClick={() => setShowPasswordModal(true)}
            className='rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]'
          >
            <MdLockReset />
            Change Password
          </Button>
          <Button
            type='button'
            variant='orange'
            onClick={() => setShowDeleteModal(true)}
          disabled={deleteUserMutation.isPending}
            className='rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#FF66004D] '
          >
            {deleteUserMutation.isPending ? 'Deleting…' : <><IoTrashSharp /> Delete Account</>}
        
          </Button>
        </div>
      </div>

      {/* Mobile View */}
      <div className='md:hidden my_profile_main_section_shadow bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex flex-col justify-start items-center p-5 relative'>
        <div className='w-full flex justify-between items-center absolute top-0 left-0 px-5 pt-5'>
          <p className='text-xl md:text-2xl font-bold text-custom-teal text-center flex-grow'>
            My Profile
          </p>
          <div className='flex items-center justify-center'>
            <Link href={`/edit-profile/${id}`}>
              <Button type='button' variant='teal' className=''>
                <RiPencilFill />
              </Button>
            </Link>
          </div>
        </div>

        <div className='flex-grow w-full'>
          <div className='pt-16'>
            <div className='flex flex-col md:flex-row justify-start items-center gap-8'>
              <Image
                src='/placeholder-image.png'
                alt='user image'
                height={90}
                width={90}
                className='rounded-full'
              />
              <div className='flex-grow items-center justify-center'>
                <h1 className='text-3xl md:text-3xl font-semibold text-center text-custom-teal'>
                  {user ? user?.firstName?.toUpperCase() : 'Loading...'}
                </h1>
                <p className='text-sm text-center text-gray-400'>
                  {user ? user?.role?.toUpperCase() : 'Loading...'}
                </p>
              </div>
            </div>

            <div>
              <h1 className='text-xl md:text-2xl font-semibold text-custom-dark-blue-1 pt-10'>
                Personal Details
              </h1>
              <div className='space-y-3 pt-7'>
                <HeadingParagraphComponent
                  heading='First Name'
                  paragraph={(user && user?.firstName?.toUpperCase()) || ''}
                />
                <HeadingParagraphComponent
                  heading='Last Name'
                  paragraph={(user && user?.lastName?.toUpperCase()) || ''}
                />
                <HeadingParagraphComponent
                  heading='Email'
                  paragraph={(user && user.email) || ''}
                />
                <HeadingParagraphComponent
                  heading='Remaining Credits'
                  paragraph={`${user?.credits ?? 0}`}
                />
              </div>
            </div>
          </div>
        </div>
        <div className='bg-white w-full pb-5 relative mt-5'>
          {' '}
          {/* Added margin-top to push content below the header */}
          <div className='flex flex-col md:flex-row justify-between items-center pt-5'>
            <div className='flex flex-col md:flex-row justify-center items-center gap-4 mt-5 md:mt-0 relative w-full'>
              <Button
                type='button'
                variant='dark-blue'
                onClick={() => setShowPasswordModal(true)}
                className='rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#2976a54d]'
              >
                <MdLockReset />
                Change Password
              </Button>
              <Button
                type='button'
                variant='orange'
                onClick={() => setShowDeleteModal(true)}
          disabled={deleteUserMutation.isPending}
                className='rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#FF66004D] '
              >
                {deleteUserMutation.isPending ? 'Deleting…' : <><IoTrashSharp /> Delete Account</>}
        
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PasswordModalComponent
         open={showPasswordModal}
         onClose={() => setShowPasswordModal(false)}
        id={id}
      />
      <ConfirmationModalComponent
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onYes={() => deleteUserMutation.mutate(id!)}
        heading='Delete Account'
        text='Are you sure you want to delete your account? All your data will be permanently deleted. This action cannot be undone.'
      />
    </>
  )
}

export default Page
