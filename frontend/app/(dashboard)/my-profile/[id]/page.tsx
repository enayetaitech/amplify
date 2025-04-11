'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from 'components/ui/button'
import PasswordModalComponent from 'components/PasswordModalComponent'
import ConfirmationModalComponent from 'components/ConfirmationModalComponent'
import HeadingParagaraphComponent from 'components/HeadingParagaraphComponent'
import { useGlobalContext } from 'context/GlobalContext'
import { RiPencilFill } from 'react-icons/ri'
import { IoTrashSharp } from 'react-icons/io5'
import { MdLockReset } from 'react-icons/md'

interface Notification {
  id: number
  image: string
  message: string
  time: string
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    image: '/user.jpg',
    message:
      'You have been assigned a new project TCT Marathon Campaign by the admin.',
    time: 'Yesterday at 9:30 AM',
    read: false,
  },
  {
    id: 3,
    image: '/user.jpg',

    message:
      'You have been assigned a new project TCT Marathon Campaign by the admin.',
    time: 'Yesterday at 9:30 AM',
    read: false,
  },
  {
    id: 2,
    image: '/user.jpg',
    message:
      'Your Pop Culture Celebration meeting is about to start in the next 15 minutes. Please get your things ready!',
    time: 'Last Thursday at 10:30 AM',
    read: true,
  },
]

const Page = () => {
  const [showModal, setShowModal] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const { user, setUser } = useGlobalContext()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  console.log(user, 'user')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        if (user?._id) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/remaining-credits/${user._id}`
          )
          setRemainingCredits(response.data.remainingCredits)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?._id])

  const handlePasswordChangeClick = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleDeleteModalOpen = () => {
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
  }

  const deleteUser = async () => {
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/users/${id}`
      )

      if (response.status === 200) {
        toast.success('User deleted successfully')
        setIsDeleteModalOpen(false)
        document.cookie =
          'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        localStorage.clear()
        setUser(null)
        router.push('/create-user')
      } else {
        toast.error('Error deleting user')
        console.error('Error deleting user:', response.data.message)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <p>Loading...</p>
      </div>
    )
  }

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
            <HeadingParagaraphComponent
              heading='First Name'
              paragraph={user?.firstName?.toUpperCase() || ''}
            />
            <HeadingParagaraphComponent
              heading='Last Name'
              paragraph={user?.lastName?.toUpperCase() || ''}
            />
            <HeadingParagaraphComponent
              heading='Email'
              paragraph={user?.email ?? ''}
            />
            <HeadingParagaraphComponent
              heading='Remaining Credits'
              paragraph={`${remainingCredits ?? 0} Min`}
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
            onClick={handlePasswordChangeClick}
            className='rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]'
          >
            <MdLockReset />
            Change Password
          </Button>
          <Button
            type='button'
            variant='orange'
            onClick={handleDeleteModalOpen}
            className='rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#FF66004D] '
          >
            <IoTrashSharp />
            Delete My Account
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
                <HeadingParagaraphComponent
                  heading='First Name'
                  paragraph={(user && user?.firstName?.toUpperCase()) || ''}
                />
                <HeadingParagaraphComponent
                  heading='Last Name'
                  paragraph={(user && user?.lastName?.toUpperCase()) || ''}
                />
                <HeadingParagaraphComponent
                  heading='Email'
                  paragraph={(user && user.email) || ''}
                />
                <HeadingParagaraphComponent
                  heading='Remaining Credits'
                  paragraph={`${remainingCredits ?? 0} Min`}
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
                onClick={handlePasswordChangeClick}
                className='rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#2976a54d]'
              >
                <MdLockReset />
                Change Password
              </Button>
              <Button
                type='button'
                variant='orange'
                onClick={handleDeleteModalOpen}
                className='rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#FF66004D] '
              >
                <IoTrashSharp />
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PasswordModalComponent
        open={showModal}
        onClose={handleCloseModal}
        id={id}
      />
      <ConfirmationModalComponent
        open={isDeleteModalOpen}
        onCancel={handleCloseDeleteModal}
        onYes={deleteUser}
        heading='Delete Account'
        text='Are you sure you want to delete your account? All your data will be permanently deleted. This action cannot be undone.'
      />
    </>
  )
}

export default Page
