// "use client";

// import { useState, useEffect } from "react";
// import { format } from "date-fns";
// import { CalendarIcon, FilterIcon } from "lucide-react";
// import { Calendar } from "components/ui/calendar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "components/ui/select";
// import { Input } from "components/ui/input";
// import { Button } from "components/ui/button";
// import { Label } from "components/ui/label";
// import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
// import { cn } from "lib/utils";

// export interface FilterValues {
//   startDate: string;
//   endDate: string;
//   status: string;
//   role: string;
//   tag: string;
//   [key: string]: string | undefined;
// }

// interface ProjectFilterProps {
//   onFilter: (filters: FilterValues) => void;
// }

// const ProjectFilter = ({ onFilter }: ProjectFilterProps) => {
//   const [startDate, setStartDate] = useState<Date | undefined>(undefined);
//   const [endDate, setEndDate] = useState<Date | undefined>(undefined);
//   const [status, setStatus] = useState("");
//   const [role, setRole] = useState("All");
//   const [tag, setTag] = useState("");

//   const statusOptions = ["Draft", "Active", "Complete", "Inactive", "Closed"];
//   // const roleOptions = ["All", "Admin", "Moderator", "Observer"];

//   useEffect(() => {
//     const filters: FilterValues = {
//       startDate: startDate ? startDate.toISOString().split("T")[0] : "",
//       endDate: endDate ? endDate.toISOString().split("T")[0] : "",
//       status,
//       role,
//       tag,
//     };
//     onFilter(filters);
//   }, [startDate, endDate, status, role, tag, onFilter]);

//   const handleClear = () => {
//     setStartDate(undefined);
//     setEndDate(undefined);
//     setStatus("");
//     setRole("All");
//     setTag("");
//   };

//   return (
//     <div className="p-4 bg-white border-2 rounded-md shadow">
//       <div className="flex flex-col lg:flex-row lg:items-center gap-4">
//         <FilterIcon className="text-gray-500" />

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
//           <div className="w-full">
//             <Label className="text-sm font-medium mb-1">Start Date</Label>
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className={cn(
//                     "w-full justify-start text-left font-normal bg-gray-100",
//                     !startDate && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {startDate ? (
//                     format(startDate, "PPP")
//                   ) : (
//                     <span>Pick a date</span>
//                   )}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0">
//                 <Calendar
//                   mode="single"
//                   selected={startDate}
//                   onSelect={setStartDate}
//                   initialFocus
//                 />
//               </PopoverContent>
//             </Popover>
//           </div>

//           <div className="w-full">
//             <Label className="text-sm font-medium mb-1">End Date</Label>
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className={cn(
//                     "w-full justify-start text-left font-normal bg-gray-100",
//                     !endDate && "text-muted-foreground"
//                   )}
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0">
//                 <Calendar
//                   mode="single"
//                   selected={endDate}
//                   onSelect={setEndDate}
//                   initialFocus
//                 />
//               </PopoverContent>
//             </Popover>
//           </div>

//           <div>
//             <Label className="text-sm font-medium mb-1">Status</Label>
//             <Select value={status} onValueChange={setStatus}>
//               <SelectTrigger className="bg-gray-100">
//                 <SelectValue placeholder="All" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="">All</SelectItem>
//                 {statusOptions.map((option) => (
//                   <SelectItem key={option} value={option}>
//                     {option}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* <div>
//             <Label className="text-sm font-medium mb-1">Role</Label>
//             <Select value={role} onValueChange={setRole}>
//               <SelectTrigger className="bg-gray-100">
//                 <SelectValue placeholder="Select role" />
//               </SelectTrigger>
//               <SelectContent>
//                 {roleOptions.map((option) => (
//                   <SelectItem key={option} value={option}>
//                     {option}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div> */}

//           <div>
//             <Label className="text-sm font-medium mb-1">Tag</Label>
//             <Input
//               type="text"
//               value={tag}
//               onChange={(e) => setTag(e.target.value)}
//               className="bg-gray-100"
//             />
//           </div>
//         </div>

//         <Button
//           onClick={handleClear}
//           variant="link"
//           className="text-blue-600 font-bold underline whitespace-nowrap"
//         >
//           Clear Filter
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default ProjectFilter;
