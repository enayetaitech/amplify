// // frontend/src/components/projectComponents/repository/AddRepositoryModal.tsx
// "use client";

// import { useState } from "react";
// import { toast } from "sonner";
// import axios from "axios";
// import { Upload } from "lucide-react";

// import { Button } from "components/ui/button";
// import { Input } from "components/ui/input";
// import { Label } from "components/ui/label";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "components/ui/select";
// import { useGlobalContext } from "context/GlobalContext";
// import { Progress } from "@/components/ui/progress";

// interface Meeting {
//   _id: string;
//   title: string;
//   [key: string]: any;
// }

// interface Project {
//   _id: string;
//   [key: string]: any;
// }

// interface User {
//   _id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   role: string;
//   [key: string]: any;
// }

// interface AddRepositoryModalProps {
//   onClose: () => void;
//   project: Project;
//   meetings: Meeting[];
//   setLocalProjectState?: (project: Project) => void;
//   fetchRepositories: (projectId: string) => void;
//   open?: boolean;
// }

// const AddRepositoryModal = ({
//   onClose,
//   project,
//   meetings,
//   setLocalProjectState,
//   fetchRepositories,
//   open = true,
// }: AddRepositoryModalProps) => {
//   // Use GlobalContext to get user information
//   const { user } = useGlobalContext() as { user: User };

//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [selectedMeeting, setSelectedMeeting] = useState<string>("");
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [uploadProgress, setUploadProgress] = useState<number>(0);

//   // Handle file input change
//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files.length > 0) {
//       setSelectedFile(event.target.files[0]);
//     }
//   };

//   // Handle meeting selection
//   const handleMeetingSelect = (meetingId: string) => {
//     setSelectedMeeting(meetingId);
//   };

//   // Handle save button
//   const handleSave = async () => {
//     if (!selectedFile || !selectedMeeting) {
//       toast.error("Please select a file and a meeting.");
//       return;
//     }

//     // Construct the form data to send to the backend
//     const formData = new FormData();
//     formData.append("file", selectedFile);
//     formData.append("fileName", selectedFile.name);
//     formData.append("type", selectedFile.type);
//     formData.append("size", selectedFile.size.toString());
//     formData.append("addedBy", `${user.firstName} ${user.lastName}`);
//     formData.append("role", user.role);
//     formData.append("addedDate", new Date().toISOString());
//     formData.append("meetingId", selectedMeeting);
//     formData.append("projectId", project._id);
//     formData.append("email", user.email);

//     try {
//       setIsLoading(true);
//       // Make the API call to upload the file
//       const response = await axios.post(
//         `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/upload`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//           onUploadProgress: (progressEvent) => {
//             if (progressEvent.total) {
//               const progress = Math.round(
//                 (progressEvent.loaded / progressEvent.total) * 100
//               );
//               setUploadProgress(progress);
//             }
//           },
//         }
//       );
//       setUploadProgress(0);
//       toast.success(response.data.message || "File uploaded successfully");
//       fetchRepositories(project._id);
//       onClose();
//     } catch (error) {
//       console.error("Error uploading file:", error);
//      toast.error(error instanceof Error ? error.message : "Unknown error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-2xl font-semibold text-blue-600">
//             Upload to Repository
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-6 py-4">
//           {/* File input */}
//           <div className="space-y-2">
//             <Label htmlFor="file">Select File</Label>
//             <Input
//               id="file"
//               type="file"
//               onChange={handleFileChange}
//               className="cursor-pointer"
//             />
//             {selectedFile && (
//               <p className="text-sm text-muted-foreground">
//                 {selectedFile.name} (
//                 {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
//               </p>
//             )}
//           </div>

//           {/* Meeting Selection */}
//           <div className="space-y-2">
//             <Label htmlFor="meeting">Select Meeting</Label>
//             <Select value={selectedMeeting} onValueChange={handleMeetingSelect}>
//               <SelectTrigger id="meeting" className="w-full">
//                 <SelectValue placeholder="-- Select a Meeting --" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectGroup>
//                   {meetings?.map((meeting) => (
//                     <SelectItem key={meeting._id} value={meeting._id}>
//                       {meeting.title}
//                     </SelectItem>
//                   ))}
//                 </SelectGroup>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Upload Progress */}
//           {isLoading && (
//             <div className="space-y-2">
//               <Label>Upload Progress</Label>
//               <Progress value={uploadProgress} className="h-2" />
//               <p className="text-sm text-center text-muted-foreground">
//                 {uploadProgress}% Complete
//               </p>
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex justify-end gap-4 pt-4">
//             <Button variant="outline" onClick={onClose} disabled={isLoading}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSave}
//               disabled={isLoading || !selectedFile || !selectedMeeting}
//               className="gap-2"
//             >
//               {isLoading ? (
//                 "Uploading..."
//               ) : (
//                 <>
//                   <Upload className="h-4 w-4" />
//                   Upload
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AddRepositoryModal;
import React from 'react'

const AddRepositoryModal = () => {
  return (
    <div>AddRepositoryModal</div>
  )
}

export default AddRepositoryModal