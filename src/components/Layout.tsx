// src/components/Layout.tsx
import { useEffect, useState, type ReactNode, type ReactElement } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ProfileModal from "./ProfileModal";

interface LayoutProps {
  children: ReactNode;
}

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const dummyProfile: Profile = {
  firstName: "admin123",
  lastName: "123",
  email: "admin@bms23.com",
  role: "ADMIN",
};

export default function Layout({ children }: LayoutProps): ReactElement {
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<Profile>(dummyProfile);

  useEffect(() => {
    const handler = () => setShowProfile(true);
    window.addEventListener("open-profile", handler);
    return () => window.removeEventListener("open-profile", handler);
  }, []);

  const handleSaveProfile = (updated: Profile) => {
    // later: call PUT /profile with updated
    setProfile(updated);
    setShowProfile(false);
  };

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>

      {showProfile && (
        <ProfileModal
          initial={profile}
          onClose={() => setShowProfile(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
