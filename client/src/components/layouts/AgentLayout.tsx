import { ReactNode } from "react";
import AgentSidebar from "./AgentSidebar";
import { useAuth } from "@/hooks/use-auth";

interface AgentLayoutProps {
  children: ReactNode;
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <AgentSidebar />
      <main className="flex-1 p-6 overflow-auto pb-14">
        {children}
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 right-0 bg-white border-t border-gray-200 py-3 px-6 z-50" 
              style={{ left: '256px' }}>
        <div className="text-center text-sm text-gray-600">
          <span className="opacity-50">Copyright © 2025 Powered by </span>
          <span className="font-semibold text-primary">LogiGoFast</span>
          {user?.officeName && (
            <span>
              <span className="opacity-50"> and Shipping by </span>
              <span className="font-semibold text-primary">{user.officeName}</span>
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}