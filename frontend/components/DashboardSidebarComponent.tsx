"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FaBars, FaListAlt, FaUserClock } from "react-icons/fa";
import { MdOutlineInsertChart } from "react-icons/md";
import { IoIosLogOut } from "react-icons/io";
import {
  ChevronDown,
  ChevronUp,
  CircleUser,
  FileText,
  UserPen,
} from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "components/ui/sheet";
import { ScrollArea } from "components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "components/ui/avatar";
import { Button } from "components/ui/button";
import { Separator } from "components/ui/separator";

import Logo from "./LogoComponent";
import api from "lib/api";
import { useGlobalContext } from "context/GlobalContext";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "components/ui/accordion";

export default function DashboardSidebar({
  handleLogoutModalOpen,
}: {
  handleLogoutModalOpen: () => void;
}) {
  const pathname = usePathname()!;
  const router = useRouter();
  const { user } = useGlobalContext();
  const userId = user?._id;

  // fetch projects
  const { data: projects = [] } = useQuery<IProject[], Error>({
    queryKey: ["projectsByUser", userId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-userId/${userId}`)
        .then((r) => r.data.data),
    staleTime: 300_000,
    enabled: Boolean(userId),
  });

  // active project
  const segments = pathname.split("/").filter(Boolean);
  const projectsIdx = segments.indexOf("projects");
  const projectId = projectsIdx > -1 && segments[projectsIdx + 1];

  // sub-nav
  const projectSubNav = projectId
    ? [
        { label: "Sessions", href: `/projects/${projectId}/sessions` },
        {
          label: "Session Deliverables",
          href: `/projects/${projectId}/session-deliverables`,
        },
        {
          label: "Observer Documents",
          href: `/projects/${projectId}/observer-documents`,
        },
        { label: "Project Team", href: `/projects/${projectId}/project-team` },
        { label: "Polls", href: `/projects/${projectId}/polls` },
        { label: "Reports", href: `/projects/${projectId}/reports` },
      ]
    : [];

  const [mobileOpen, setMobileOpen] = useState(false);
  // Collapsible controllers
  const [projectsOpen, setProjectsOpen] = useState(
    pathname.startsWith("/projects")
  );
  const [acctOpen, setAcctOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  // close logout pop-over on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLogoutMenu(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <>
      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden fixed top-4 left-4 z-40">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <FaBars />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="p-0 w-64">
          <Logo className="p-6" />
          <ScrollArea className="h-[calc(100vh-128px)] px-6">
            {/* same content as desktop below */}
            {/* … */}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop aside */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 bg-[#D5D6D8] shadow">
        <div className="p-6">
          <Logo />
        </div>
        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          {/* Projects group */}
          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
            <CollapsibleTrigger
              className={`flex items-center justify-between w-full py-1 px-2 rounded-xl font-semibold cursor-pointer bg-custom-white ${
                pathname.startsWith("/projects")
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3 ">
                <FaListAlt />
                <span className="text-custom-blue-gray-1">Projects</span>
              </div>
              {projectsOpen ? (
                <ChevronUp className="text-custom-blue-gray-1" />
              ) : (
                <ChevronDown className="text-custom-blue-gray-1" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 mt-2">
              <Accordion type="single" collapsible className="space-y-1">
                {projects.map((p) => {
                  const base = `/projects/${p._id}`;
                  return (
                    <AccordionItem key={p._id} value={p._id}>
                      <AccordionTrigger
                        className={`flex items-center justify-between py-1 ${
                          pathname.startsWith(base)
                            ? "text-blue-500 font-medium"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        {p.name}
                      </AccordionTrigger>

                      <AccordionContent className="pl-4 space-y-1">
                        <Link
                          href={`${base}/sessions`}
                          className={`block py-1 ${
                            pathname === `${base}/sessions`
                              ? "text-blue-400 underline"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          Sessions
                        </Link>
                        <Link
                          href={`${base}/session-deliverables`}
                          className={`block py-1 ${
                            pathname === `${base}/session-deliverables`
                              ? "text-blue-400 underline"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          Session Deliverables
                        </Link>
                        <Link
                          href={`${base}/observer-documents`}
                          className={`block py-1 ${
                            pathname === `${base}/observer-documents`
                              ? "text-blue-400 underline"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          Observer Documents
                        </Link>
                        <Link
                          href={`${base}/project-team`}
                          className={`block py-1 ${
                            pathname === `${base}/project-team`
                              ? "text-blue-400 underline"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          Project Team
                        </Link>
                        <Link
                          href={`${base}/polls`}
                          className={`block py-1 ${
                            pathname === `${base}/polls`
                              ? "text-blue-400 underline"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          Polls
                        </Link>
                        <Link
                          href={`${base}/reports`}
                          className={`block py-1 ${
                            pathname === `${base}/reports`
                              ? "text-blue-400 underline"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          Reports
                        </Link>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-4" />

          {/* Static links */}
          <div className="space-y-4">
            {/* Account group */}
            <Collapsible open={acctOpen} onOpenChange={setAcctOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 cursor-pointer text-gray-700 hover:text-gray-900">
                <div className="flex items-center gap-3">
                  <CircleUser />
                  <span>Account</span>
                </div>
                {acctOpen ? <ChevronUp /> : <ChevronDown />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-2 space-y-2">
                <Link
                  href={`/my-profile/${user?._id}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <UserPen /> Profile
                </Link>
                <Link
                  href="/payment"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <FileText /> Billing
                </Link>
              </CollapsibleContent>
            </Collapsible>

            {/* Admin-only */}
            {user?.role === "AmplifyAdmin" && (
              <>
                <Link
                  href="/external-admins"
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900"
                >
                  <FaUserClock />
                  <span>External Admins</span>
                </Link>
                <Link
                  href="/internal-admins"
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900"
                >
                  <FaUserClock />
                  <span>Internal Admins</span>
                </Link>
                <Link
                  href="/companies"
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900"
                >
                  <MdOutlineInsertChart />
                  <span>Companies</span>
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
                <AvatarFallback>{user?.firstName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-sm truncate">
                <p className="font-semibold">
                  {user?.firstName} {user?.lastName}
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
                <FaBars /> {/* swap for BsThreeDotsVertical if you like */}
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
      </aside>
    </>
  );
}
