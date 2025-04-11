"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "./LogoComponent";
import { FaListAlt, FaUserClock, FaBars } from "react-icons/fa";
import { MdOutlineInsertChart } from "react-icons/md";
import { IoIosLogOut } from "react-icons/io";
import { AiOutlineClose } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useDashboard } from "context/DashboardContext";
import {
  ChevronDown,
  ChevronUp,
  CircleUser,
  FileText,
  UserPen,
} from "lucide-react";

const SidebarLinks = ({ user, setViewProject }: any) => {
  const [showAccountsSubmenu, setShowAccountsSubmenu] = useState(false);

  return (
    <>
      <Link href="/project" onClick={() => setViewProject(false)}>
        <div className="flex items-center gap-3 pt-5">
          <FaListAlt className="text-base text-[#6A7E88]" />
          <p className="text-base font-semibold text-[#6A7E88]">Dashboard</p>
        </div>
      </Link>
      <Link href="/observers">
        <div className="flex items-center gap-3 pt-5">
          <FaListAlt className="text-base text-[#6A7E88]" />
          <p className="text-base font-semibold text-[#6A7E88]">Observers</p>
        </div>
      </Link>

      {/* Accounts with submenu */}
      <div
        className="flex flex-col gap-1 pt-5 cursor-pointer"
        onClick={() => setShowAccountsSubmenu(!showAccountsSubmenu)}
      >
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <CircleUser size={20} className="text-base text-[#6A7E88]" />
            <p className="text-base font-semibold text-[#6A7E88]">Account</p>
          </div>
          {showAccountsSubmenu ? (
            <ChevronUp color="#6A7E88" size={18} />
          ) : (
            <ChevronDown color="#6A7E88" size={18} />
          )}
        </div>

        {showAccountsSubmenu && (
          <div className="mt-5 flex flex-col gap-5">
            <Link
              href={`/my-profile/${user?._id}`}
              className="flex items-center gap-3"
            >
              <UserPen size={20} className="text-base text-[#6A7E88]" />

              <p className="text-base text-[#6A7E88] font-semibold">Profile</p>
            </Link>
            <Link href="/payment" className="flex items-center gap-3">
              <FileText size={20} className="text-base text-[#6A7E88]" />
              <p className="text-base text-[#6A7E88] font-semibold">Billing</p>
            </Link>
          </div>
        )}
      </div>

      {(user?.role === "SuperAdmin" || user?.role === "AmplifyAdmin") && (
        <>
          <Link href="/dashboard/external-admins">
            <div className="flex items-center gap-3 pt-5">
              <FaUserClock className="text-base text-[#6A7E88]" />
              <p className="text-base font-semibold text-[#6A7E88]">
                External Admins
              </p>
            </div>
          </Link>
          <Link href="/dashboard/internal-admins">
            <div className="flex items-center gap-3 pt-5">
              <FaUserClock className="text-base text-[#6A7E88]" />
              <p className="text-base font-semibold text-[#6A7E88]">
                Internal Admins
              </p>
            </div>
          </Link>
          <Link href="/dashboard/companies">
            <div className="flex items-center gap-3 pt-5">
              <MdOutlineInsertChart className="text-base text-[#6A7E88]" />
              <p className="text-base font-semibold text-[#6A7E88]">
                Companies
              </p>
            </div>
          </Link>
        </>
      )}
    </>
  );
};

const UserInfo = ({
  user,
  handleModalOpen,
  isModalOpen,
  modalRef,
  handleLogoutModalOpen,
}: any) => (
  <div className="relative w-[240px] mx-auto">
    <div className="flex items-center gap-2 bg-[#f1f1f1] h-20 rounded-lg bg-opacity-70 user_info_div_shadow mb-6 pl-2">
      <Image
        src="/user.jpg"
        alt="user image"
        height={40}
        width={40}
        className="rounded-full"
      />
      <div>
        <p className="text-custom-dark-blue-1 font-bold text-base">
          {`${user?.firstName?.slice(0, 12)}${
            user?.firstName?.length > 12 ? "..." : ""
          } `}
          {`${user?.lastName?.slice(0, 12)}${
            user?.lastName?.length > 12 ? "..." : ""
          }`}
        </p>
        <p className="text-[11px] text-custom-dark-blue-1">
          {user?.email?.length > 20
            ? `${user.email.slice(0, 20)}...`
            : user?.email}
        </p>
      </div>
      <BsThreeDotsVertical
        className="cursor-pointer text-custom-dark-blue-1"
        onClick={handleModalOpen}
      />
    </div>

    {isModalOpen && (
      <div
        ref={modalRef}
        className="absolute bottom-12 -right-24 z-50 bg-white rounded-lg h-[40px] w-[125px] profile_dropdown_shadow flex flex-col px-3 py-2 gap-4"
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={handleLogoutModalOpen}
        >
          <IoIosLogOut className="text-[#697e89] h-3 w-3" />
          <p className="text-sm text-[#697e89]">Logout</p>
        </div>
      </div>
    )}
  </div>
);

const DashboardSidebarComponent = ({
  handleLogoutModalOpen,
  isLogoutModalOpen,
  user,
}: any) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef(null);
  const { setViewProject } = useDashboard();

  const handleModalOpen = () => setIsModalOpen((prev) => !prev);
  const handleSidebarToggle = () => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !(modalRef.current as any).contains(event.target)
      ) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Hamburger Icon */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <FaBars
          className="h-6 w-6 text-custom-dark-blue-1 cursor-pointer"
          onClick={handleSidebarToggle}
        />
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:relative top-0 left-0 h-screen md:h-screen z-40 w-[260px] transition-transform duration-300 dashboard_sidebar_bg flex flex-col items-center ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Close Icon for Mobile */}
        <div className="md:hidden absolute top-4 right-4">
          <AiOutlineClose
            size={30}
            className="text-[#6A7E88] cursor-pointer"
            onClick={handleSidebarToggle}
          />
        </div>

        {/* Logo */}
        <div className="py-10">
          <Logo />
        </div>

        {/* Links */}
        <div className="flex-grow w-full px-6">
          <SidebarLinks user={user} setViewProject={setViewProject} />
        </div>

        {/* User Info */}
        <UserInfo
          user={user}
          handleModalOpen={handleModalOpen}
          isModalOpen={isModalOpen}
          modalRef={modalRef}
          handleLogoutModalOpen={handleLogoutModalOpen}
        />
      </div>
    </>
  );
};

export default DashboardSidebarComponent;
