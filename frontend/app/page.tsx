import HeadingBlue25px from 'components/HeadingBlue25px'
import { Button } from 'components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className='flex flex-col justify-center items-center min-h-screen meeting_bg space-y-5'>
      <HeadingBlue25px>Welcome to Amplify Research</HeadingBlue25px>

      <Link href='/login'>
        <Button variant='default' className='bg-[#FC6E15] hover:bg-[#FC65E15]'>
          Login
        </Button>
      </Link>

      <Link href='/create-user'>
        <Button variant='default' className='bg-[#FC6E15] hover:bg-[#FC65E15]'>
          Register
        </Button>
      </Link>
    </div>
  )
}
