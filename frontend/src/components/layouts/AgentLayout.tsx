import { ReactNode } from "react";
import AgentSidebar from "./AgentSidebar";

interface AgentLayoutProps {
  children: ReactNode;
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <AgentSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}