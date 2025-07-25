// hooks/useProfileModals.ts
"use client";
import { useState } from "react";

export function useProfileModals() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  return {
    showPasswordModal,
    setShowPasswordModal,
    showDeleteModal,
    setShowDeleteModal,
  };
}
