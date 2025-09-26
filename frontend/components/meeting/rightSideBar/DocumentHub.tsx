import { Separator } from '@radix-ui/react-select'
import { Button } from 'components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from 'components/ui/card'
import { FileText, Folder, Trash2 } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

const DocumentHub = () => {
  return (
    <div>
      <Card className=" border-none shadow-none">
        <CardHeader className=" px-3 flex items-center justify-between">
          <CardTitle className="flex  items-center gap-2 text-sm text-[#00293C]">
            <FileText className="h-4 w-4" />
            DOCUMENT HUB
          </CardTitle>
          <CardAction>
            <Button
              variant="orange"
              className="text-sm px-4 py-[1px] rounded-full"
              onClick={() => toast("Yet to implement")}
            >
              Upload File
            </Button>
          </CardAction>
        </CardHeader>
        <Separator className="" />

        <CardContent className="px-3 pb-3">
          <div className="bg-custom-gray-2 rounded-xl  p-2">
            <div className="flex items-center justify-between px-3 text-[12px] text-gray-600">
              <span>Name</span>
              <span>Size</span>
            </div>
            <div className="mt-2 rounded-lg bg-custom-gray-2 p-2">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate text-sm">
                    PRO_FILES_01: Introduction...
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600">5.2MB</span>
                  <button
                    type="button"
                    className="text-red-500 cursor-pointer"
                    aria-label="Delete file"
                    onClick={() => toast("Yet to implement")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DocumentHub
