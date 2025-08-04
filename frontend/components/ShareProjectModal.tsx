// import Link from "next/link";
// import React, { useState } from "react";
// import { CheckCircle } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "components/ui/dialog";
// import { Button } from "components/ui/button";
// import { Card, CardContent } from "components/ui/card";
// import { toast } from "sonner";

// interface Project {
//   name: string;
//   projectPasscode?: string;
// }

// interface ShareProjectModalProps {
//   project: Project;
//   onClose: () => void;
//   open: boolean;
// }

// const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
//   project,
//   onClose,
//   open,
// }) => {
//   const [accessLevel] = useState("Observer Access");

//   const handleCopyInvite = () => {
//     const inviteText =
//       accessLevel === "Observer Access"
//         ? `You are added as an observer in a Project named ${project.name}. The project is now accessible to you as an observer.\n\nJoin Project\n${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/login\n\nOr\n\nCreate an account\n${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/register`
//         : `Participant does not have access to the project.`;

//     navigator.clipboard.writeText(inviteText);
//     toast.success("Project invite copied to clipboard!");
//   };

//   return (
//     <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="w-4/5 md:w-2/5 max-w-3xl p-6">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-5xl"
//         >
//           &times;
//         </button>

//         <div className="flex justify-center items-center my-4 text-6xl text-green-500">
//           <CheckCircle className="w-16 h-16" />
//         </div>

//         <DialogHeader>
//           <DialogTitle className="text-2xl font-semibold text-center text-gray-800">
//             Project is successfully created!
//           </DialogTitle>
//           <p className="text-md text-center text-gray-500 mb-4">
//             {accessLevel === "Observer Access"
//               ? "Share project"
//               : "Generate link to share"}
//           </p>
//         </DialogHeader>

//         <div className="mb-4 flex justify-center">
//           <p>Observer Access</p>
//         </div>

//         <Card>
//           <CardContent className="p-4">
//             <p className="text-sm">
//               You are added as an observer in a Project named{" "}
//               <strong>{project.name}</strong>. The project is now accessible to
//               you as an observer.
//             </p>
//             <p className="mt-2 text-sm">
//               <strong>Join Project</strong>
//               <br />
//               <Link
//                 href="https://amplifier.hgsingalong.com/login"
//                 className="text-blue-500"
//               >
//                 https://amplifier.hgsingalong.com/login
//               </Link>
//             </p>
//             <p className="mt-2 text-sm">
//               <strong>Passcode:</strong> {project.projectPasscode}
//             </p>
//             <p className="mt-4 text-sm">Or</p>
//             <p className="mt-2 text-sm">
//               <strong>Create an account</strong>
//               <br />
//               <Link
//                 href="https://amplifier.hgsingalong.com/register"
//                 className="text-blue-500"
//               >
//                 https://amplifier.hgsingalong.com/register
//               </Link>
//             </p>
//           </CardContent>
//         </Card>

//         <Button
//           onClick={handleCopyInvite}
//           className="w-full mt-4 bg-teal-500 hover:bg-teal-700"
//         >
//           {accessLevel === "Observer Access"
//             ? "Copy Project Invite"
//             : "Copy Meeting Invite"}
//         </Button>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default ShareProjectModal;
