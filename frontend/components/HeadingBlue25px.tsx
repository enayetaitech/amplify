import React, { ReactNode } from 'react'

interface HeadingBlue25pxProps {
  children: ReactNode
}

const HeadingBlue25px: React.FC<HeadingBlue25pxProps> = ({ children }) => {
  return (
    <h1 className='text-[#1E656D] text-2xl text-center md:text-start font-bold'>
      {children}
    </h1>
  )
}

export default HeadingBlue25px
