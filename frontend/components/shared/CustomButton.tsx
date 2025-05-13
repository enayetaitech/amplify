// components/ui/CustomButton.tsx
import * as React from 'react'
import { Button } from 'components/ui/button'
import { cn } from 'lib/utils'

type ShadcnButtonProps = React.ComponentProps<typeof Button>

export interface CustomButtonProps extends ShadcnButtonProps {
  /** optional icon (e.g. <FaPlus />) */
  icon?: React.ReactNode
  /** where to put the icon relative to the text */
  iconPosition?: 'left' | 'right'
  /** button label; falls back to children if omitted */
  text?: React.ReactNode
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    {
      icon,
      iconPosition = 'left',
      text,
      children,
      className,
      ...buttonProps
    },
    ref
  ) => {
    // allow either `text` or `children`
    const content = text ?? children

    return (
      <Button
        ref={ref}
        className={cn('inline-flex items-center', className)}
        {...buttonProps}
      >
        {icon && iconPosition === 'left' && (
          <span className="mr-1 flex items-center">{icon}</span>
        )}
        {content}
        {icon && iconPosition === 'right' && (
          <span className="ml-1 flex items-center">{icon}</span>
        )}
      </Button>
    )
  }
)

CustomButton.displayName = 'CustomButton'
export default CustomButton


// ! Usage examples:

// import { FaPlus, FaTrash } from 'react-icons/fa'
// import CustomButton from 'components/ui/CustomButton'

// just text
// <CustomButton onClick={() => console.log('clicked')}>Click me</CustomButton>

// icon on the left, full width, outline variant
// <CustomButton
//   icon={<FaPlus />}
//   text="Add Item"
//   variant="outline"
//   className="w-full"
//   onClick={handleAdd}
// />

// icon on the right
// <CustomButton
//   icon={<FaTrash />}
//   iconPosition="right"
//   text="Delete"
//   variant="destructive"
//   onClick={handleDelete}
// />
