import React from 'react'

interface HeadingParagraphProps {
  heading: string
  paragraph: string
}

const HeadingParagaraph: React.FC<HeadingParagraphProps> = ({
  heading,
  paragraph,
}) => {
  return (
    <div>
      <h1 className='text-lg font-semibold text-custom-dark-blue-1'>
        {heading}
      </h1>
      <p className='text-lg font-medium text-custom-dark-blue-2'>{paragraph}</p>
    </div>
  )
}

export default HeadingParagaraph
