// components/SidebarContent.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FaBars, FaListAlt, FaUserClock } from "react-icons/fa";
import { MdOutlineInsertChart } from "react-icons/md";
import {
  ChevronDown,
  ChevronUp,
  CircleUser,
  FileText,
  UserPen,
} from "lucide-react";
import { ScrollArea } from "components/ui/scroll-area";
import { Separator } from "components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "components/ui/avatar";
import { Button } from "components/ui/button";
import api from "lib/api";
import { useGlobalContext } from "context/GlobalContext";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "components/ui/collapsible";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "components/ui/accordion";
import { IoIosLogOut } from "react-icons/io";
import { projectSections } from "constant/projectSections";

export default function SidebarContent({
  handleLogoutModalOpen,
}: {
  handleLogoutModalOpen: () => void;
}) {
  const pathname = usePathname()!;
  const router = useRouter();
  const { user } = useGlobalContext();
  const userId = user?._id;
  const { data: projects = [] } = useQuery<IProject[], Error>({
    queryKey: ["projectsByUser", userId],
    queryFn: () =>
      api
        .get(
          `/api/v1/projects/get-project-by-userId/${userId}?search=&status=Active&page=1&limit=100`
        )
        .then((r) => r.data.data),
    staleTime: 300_000,
    enabled: Boolean(userId),
  });

  const [projectsOpen, setProjectsOpen] = useState(
    pathname.startsWith("/projects")
  );
  const accountActive = [`/my-profile/${userId}`, "/billing"].some((p) =>
    pathname.startsWith(p)
  );
  const [acctOpen, setAcctOpen] = useState(accountActive);

  // logout menu logic (only for desktop; mobile can ignore or adapt)
  const menuRef = useRef<HTMLDivElement>(null);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLogoutMenu(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // inside SidebarContent.tsx, above your component or at top of it:
  function formatDisplayName(firstName: string, lastName: string) {
    const initial = lastName.charAt(0).toUpperCase();
    const maxLen = 16;
    const spacePlusInit = ` ${initial}`; // 2 chars

    // If it already fits, just return "FirstName I"
    if (`${firstName}${spacePlusInit}`.length <= maxLen) {
      return `${firstName}${spacePlusInit}`;
    }

    // Otherwise, truncate firstName so that:
    //  truncatedFirst.length + 2 (for "..") + 2 (for " I") === maxLen
    const truncatedFirstLen = maxLen - 4; // maxLen - (".." + spacePlusInit).length
    const truncatedFirst = firstName.slice(0, truncatedFirstLen);

    return `${truncatedFirst}..${spacePlusInit}`;
  }

  return (
    <>
      <ScrollArea className="flex-1 px-6 overflow-y-auto">
        {/* Projects group */}
        <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
          <CollapsibleTrigger
            className={`flex items-center justify-between w-full py-1 px-2 rounded-xl font-semibold cursor-pointer bg-custom-white ${
              pathname.startsWith("/projects")
                ? "text-custom-dark-blue-1"
                : "text-custom-blue-gray-1 hover:text-custom-gray-5"
            }`}
            onClick={() => {
              // Always toggle the panel...
              setProjectsOpen(!projectsOpen);
              // ...then navigate to /projects
              router.push("/projects");
            }}
          >
            <div className="flex items-center gap-3 ">
              <FaListAlt className="h-4 w-4" />
              <span className="">Projects</span>
            </div>
            {projectsOpen ? (
              <ChevronUp className="" />
            ) : (
              <ChevronDown className="" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-6 mt-1 py-1 px-2 bg-[#F3F4F6] rounded-xl">
            <Accordion type="single" collapsible className="space-y-1">
              {projects?.map((p) => {
                const base = `/projects/${p._id}`;
                return (
                  <AccordionItem key={p._id} value={p?._id}>
                    <AccordionTrigger
                      className={`flex items-center justify-between py-1 ${
                        pathname.startsWith(base)
                          ? "text-custom-dark-blue-1 font-medium bg-white rounded px-2"
                          : "text-custom-blue-gray-1 hover:text-custom-gray-5"
                      }`}
                    >
                      <Link href={`/view-project/${p._id}`} className="flex-1">
                        {p.name}
                      </Link>
                    </AccordionTrigger>

                    <AccordionContent className="pl-4 space-y-1">
                      {projectSections.map(({ slug, label }) => (
                        <Link
                          key={slug}
                          href={`${base}/${slug}`}
                          className={`block py-1 rounded px-2 ${
                            pathname === `${base}/${slug}`
                              ? "bg-white text-custom-dark-blue-1 font-medium"
                              : "text-custom-blue-gray-1 hover:text-custom-gray-5"
                          }`}
                        >
                          {label}
                        </Link>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CollapsibleContent>
        </Collapsible>

        <Separator className="my-2" />

        {/* Static links */}
        <div className="space-y-4 pb-5">
          {/* Account group */}
          <Collapsible open={acctOpen} onOpenChange={setAcctOpen}>
            <CollapsibleTrigger
              className={`flex items-center justify-between w-full py-1 px-2 rounded-xl font-semibold cursor-pointer bg-custom-white ${
                accountActive
                  ? "text-custom-dark-blue-1"
                  : "text-custom-blue-gray-1 hover:text-custom-gray-5"
              }`}
            >
              <div className="flex items-center gap-3">
                <CircleUser className="h-5 w-5" />
                <span className="">Account</span>
              </div>
              {acctOpen ? (
                <ChevronUp className="" />
              ) : (
                <ChevronDown className="" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 mt-2 py-1 px-2 bg-[#F3F4F6] rounded-xl space-y-2 text-sm">
              <Link
                href={`/my-profile/${user?._id}`}
                className={`flex items-center gap-2 ${
                  pathname === `/my-profile/${user?._id}`
                    ? "text-custom-dark-blue-1 font-medium"
                    : "text-custom-blue-gray-1 hover:text-custom-gray-5"
                }`}
              >
                <UserPen className="h-3.5 w-3.5" /> Profile
              </Link>
              <Link
                href="/billing"
                className={`flex items-center gap-2 ${
                  pathname === `/billing`
                    ? "text-custom-dark-blue-1 font-medium"
                    : "text-custom-blue-gray-1 hover:text-custom-gray-5"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Billing
              </Link>
            </CollapsibleContent>
          </Collapsible>

          {/* Admin-only */}
          {(user?.role === "AmplifyAdmin" || user?.role === "SuperAdmin") && (
            <>
              <Link
                href="/admin/external-admins"
                className="flex items-center gap-3 text-custom-blue-gray-1 hover:text-custom-gray-5"
              >
                <FaUserClock />
                <span>External Admins</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 text-custom-blue-gray-1 hover:text-custom-gray-5"
              >
                <FaUserClock />
                <span>Internal Admins</span>
              </Link>
              <Link
                href="/admin/admin-list"
                className="flex items-center gap-3 text-custom-blue-gray-1 hover:text-custom-gray-5"
              >
                <MdOutlineInsertChart />
                <span>Admin List</span>
              </Link>
              <Link
                href="/admin/projects"
                className="flex items-center gap-3 text-custom-blue-gray-1 hover:text-custom-gray-5"
              >
                <MdOutlineInsertChart />
                <span>All Projects</span>
              </Link>
              <Link
                href="/admin/sessions"
                className="flex items-center gap-3 text-custom-blue-gray-1 hover:text-custom-gray-5"
              >
                <MdOutlineInsertChart />
                <span>All Sessions</span>
              </Link>
            </>
          )}
        </div>
      </ScrollArea>

      {/* User info */}
      <div className="px-2 py-2 bg-gray-100">
        <div className="relative flex items-center justify-between p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/user.jpg" alt="avatar" />
              <AvatarFallback>
                {(user?.firstName?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm truncate">
              <p className="font-semibold">
                {user ? formatDisplayName(user.firstName, user.lastName) : ""}
              </p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
          </div>
          <div ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLogoutMenu((v) => !v)}
            >
              <FaBars />
            </Button>
            {showLogoutMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-36 bg-white border rounded shadow-md">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowLogoutMenu(false);
                    handleLogoutModalOpen();
                  }}
                >
                  <IoIosLogOut className="mr-2" /> Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
