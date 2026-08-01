import type { ReactNode } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";

type EmpresaLayoutProps = {
  children: ReactNode;
};

export default function EmpresaLayout({
  children,
}: EmpresaLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}