import { cn } from 'lib/utils'
import React, { ReactNode } from 'react'


interface HeadingBlue25pxProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
}

const HeadingBlue25px: React.FC<HeadingBlue25pxProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <h1
      className={cn(
        'text-custom-dark-blue-1 text-2xl text-center md:text-start font-bold',
        className
      )}
      {...rest}
    >
      {children}
    </h1>
  )
}

export default HeadingBlue25px
