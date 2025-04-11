import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'

interface ConfirmationModalProps {
  open: boolean
  onCancel: () => void
  onYes: () => void
  heading: string
  text: string
}

const ConfirmationModalComponent: React.FC<ConfirmationModalProps> = ({
  open,
  onCancel,
  onYes,
  heading,
  text,
}) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className='rounded-2xl w-[420px]'>
        <DialogHeader>
          <DialogTitle className='text-[#031F3A] text-2xl'>
            {heading}
          </DialogTitle>
          <DialogDescription className='text-[#AFAFAF] text-[11px]'>
            {text}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='gap-4 sm:justify-end mt-12'>
          <Button
            variant='dark-blue'
            type='button'
            onClick={onCancel}
            className='rounded-xl py-1 px-7 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Cancel
          </Button>
          <Button
            variant='orange'
            type='button'
            onClick={onYes}
            className='rounded-xl py-1 px-10 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmationModalComponent
