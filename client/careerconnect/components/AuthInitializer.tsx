"use client";

import { useEffect } from "react";
import useAuthStore from "@/store/authStore";

export default function AuthInitializer() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}