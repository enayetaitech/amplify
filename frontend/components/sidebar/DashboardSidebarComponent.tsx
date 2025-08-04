"use client";

import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import { Sheet, SheetContent, SheetTrigger } from "components/ui/sheet";
import { Button } from "components/ui/button";
import Logo from "../shared/LogoComponent";
import SidebarContent from "./SidebarContent";

export default function DashboardSidebar({
  handleLogoutModalOpen,
}: {
  handleLogoutModalOpen: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden fixed top-4 left-4 z-40 bg-[#D5D6D8]">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <FaBars />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="p-0 w-64 bg-[#D5D6D8]">
          <div className="p-6">
            <Logo />
          </div>
          <SidebarContent handleLogoutModalOpen={handleLogoutModalOpen} />
        </SheetContent>
      </Sheet>

      {/* Desktop aside */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 bg-[#D5D6D8] shadow">
        <div className="p-6">
          <Logo />
        </div>
        <SidebarContent handleLogoutModalOpen={handleLogoutModalOpen} />
      </aside>
    </>
  );
}
