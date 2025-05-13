import { IModerator } from '@shared/interface/ModeratorInterface';
import { IPaginationMeta } from '@shared/interface/PaginationInterface';
import CustomButton from 'components/shared/CustomButton';
import { Button } from 'components/ui/button';
import { Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell, } from 'components/ui/table';
import { ChevronsUpDown, Pencil } from 'lucide-react';
import React from 'react'


export interface ProjectTeamsTableProps {
  moderators: IModerator[];
  meta: IPaginationMeta;
  onPageChange: (newPage: number) => void;

}


const ProjectTeamsTable: React.FC<ProjectTeamsTableProps> = ({
  moderators, meta, onPageChange
}) => {
  return (
    <div className=" rounded-lg shadow-lg overflow-x-auto">
      <div className="bg-white rounded-lg shadow-lg">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader>
           <TableRow className="">
            {[
              "Member Name",
              "Role",
              "Activity Log",
              "Actions",
            ].map((col) => (
              <TableHead
                key={col}
                className="px-6 py-3 text-center text-xs font-semibold text-custom-dark-blue-1 uppercase tracking-wider"
              >
                <div className="inline-flex items-center space-x-1">
                  <span>{col}</span>
                  <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </TableHead>
            ))}
            <TableHead className="px-6 py-3" /> {/* action menu */}
          </TableRow>
        </TableHeader>

        <TableBody className="bg-white divide-y divide-gray-100 text-center">
          {moderators.map((m) => (
            <TableRow
              key={m._id}
              className="cursor-pointer hover:bg-gray-50"
            >
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.firstName}</TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {/* role */}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"> {/*activity log*/}</TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                <CustomButton
                icon={<Pencil/>}
               
                className=" bg-custom-orange-1 text-white hover:bg-custom-orange-2 font-semibold px-2"
                />
              </TableCell>
              

            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={8} className="px-6 py-4 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Showing{" "}
                  {(meta.page - 1) * meta.limit + 1} to{" "}
                  {Math.min(meta.page * meta.limit, meta.totalItems)} of{" "}
                  {meta.totalItems} entries
                </span>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    disabled={!meta.hasPrev}
                    onClick={() => onPageChange(meta.page - 1)}
                  >
                    Previous
                  </Button>
                  {[...Array(meta.totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={meta.page === i + 1 ? "default" : "outline"}
                      onClick={() => onPageChange(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    disabled={!meta.hasNext}
                    onClick={() => onPageChange(meta.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
    </div>
  )
}

export default ProjectTeamsTable