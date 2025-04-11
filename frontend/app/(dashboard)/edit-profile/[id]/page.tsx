'use client'
import React, { useState, useEffect, ChangeEvent } from 'react'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaSave } from 'react-icons/fa'
import { toast } from 'sonner'
import { useGlobalContext } from 'context/GlobalContext'
import { Button } from 'components/ui/button'
import InputFieldComponent from 'components/InputFieldComponent'
import { EditUser } from '@shared/interface/UserInterface'

const Page: React.FC = () => {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [user, setUser] = useState<EditUser>({
    firstName: '',
    lastName: '',
    email: '',
  })
  const { setUser: setGlobalUser } = useGlobalContext()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/users/find-by-id`,
          {
            params: { id },
          }
        )
        setUser(response.data.data)
      } catch (error: any) {
        console.error('Error fetching user data:', error)
        if (error.response && error.response.status === 404) {
        }
      }
    }

    fetchUserData()
  }, [id])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/users/edit/${id}`,
        user
      )
      console.log('response', response)

      setGlobalUser(response.data.data)
      document.cookie = `token=${response.data.accessToken}; path=/; max-age=86400;`
      localStorage.setItem('user', JSON.stringify(response.data))
      toast.success('Profile updated successfully')
      router.push(`/my-profile/${id}`)
    } catch (error) {
      console.error('Error updating user data:', error)
      toast.error('Failed to update profile')
    }
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
              className='rounded-xl w-[100px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]'
            >
              <FaSave />
              Save
            </Button>
          </div>
          <div className='flex justify-center items-center gap-4 md:hidden fixed right-5'>
            <Button
              type='button'
              variant='teal'
              onClick={handleSave}
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
                {user?.firstName} {user?.lastName}
              </h1>
              <p className='text-center text-gray-400 md:text-left'>
                {user?.role}
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
                value={user?.firstName}
                onChange={handleInputChange}
              />
              <InputFieldComponent
                label='Last Name'
                name='lastName'
                value={user?.lastName}
                onChange={handleInputChange}
              />
              <InputFieldComponent
                label='Email'
                name='email'
                value={user?.email}
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
