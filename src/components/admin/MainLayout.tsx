import React from 'react'
import { DashboardHeader } from '../dashboard/DashboardHeader'
import { WelcomeHeroSection } from '../dashboard/WelcomeHeroSection'
import { DashboardSidebar } from '../dashboard/DashboardSidebar'

interface Profile {
  id: number;
  name: string;
  role: string;
  avatar: string | undefined;
  preferences: { professionalStatus: string };
}

interface Stats {
  notifications: { unread: number };
  chat: { totalUnread: number };
  totalRecords: number;
  processedFiles: number;
  activeUsers: number;
  systemHealth: string;
}

interface MainLayoutProps {
  currentProfile: Profile;
  stats: Stats;
  children: React.ReactNode;
}

export function MainLayout({
  currentProfile,
  stats,
  children
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        currentProfile={currentProfile}
        stats={stats}
        onSwitchProfile={() => {}}
        onLogout={() => {}}
      />

      <WelcomeHeroSection
        profile={currentProfile}
        stats={stats}
        totalEngagement={0}
      />

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <DashboardSidebar
              currentProfile={currentProfile}
              stats={stats}
            />
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}