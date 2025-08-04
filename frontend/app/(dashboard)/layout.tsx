"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { useGlobalContext } from "../../context/GlobalContext";
import { useRouter } from "next/navigation";
import FooterComponent from "components/shared/FooterComponent";
import DashboardSidebarComponent from "../../components/sidebar/DashboardSidebarComponent";
import LogoutModalComponent from "components/LogoutModalComponent";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useGlobalContext();
  const router = useRouter();

  const handleLogoutModalOpen = () => {
    setIsLogoutModalOpen(!isLogoutModalOpen);
  };

  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  useEffect(() => {
    if (!user || Object.keys(user).length === 0) {
      router.push("/login");
    }
  }, [user, router]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-screen">
      {/* Sidebar */}
      <div className="relative z-50">
        <DashboardSidebarComponent
          handleLogoutModalOpen={handleLogoutModalOpen}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        <main className="flex-grow overflow-x-hidden">{children}</main>
        <footer className="mt-auto">
          <FooterComponent />
        </footer>
      </div>

      {isLogoutModalOpen && (
        <LogoutModalComponent
          open={isLogoutModalOpen}
          onClose={handleCloseLogoutModal}
        />
      )}
    </div>
   
  );
};
export default DashboardLayout;
