// src/components/Layout.tsx
import {
  useEffect,
  useState,
  type ReactNode,
  type ReactElement,
} from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ProfileModal from "./ProfileModal";
import { api } from "../services/api";

interface LayoutProps {
  children: ReactNode;
}

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function Layout({ children }: LayoutProps): ReactElement {
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // load real profile once
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/profile");
        setProfile(res.data.profile);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }
    load();
  }, []);

  // listen for "open-profile" from TopBar
  useEffect(() => {
    const handler = () => setShowProfile(true);
    window.addEventListener("open-profile", handler);
    return () => window.removeEventListener("open-profile", handler);
  }, []);

  const handleSaveProfile = async (updated: Profile) => {
    try {
      const res = await api.put("/profile", updated);
      setProfile(res.data.profile);
      setShowProfile(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar profile={profile} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>

      {profile && showProfile && (
        <ProfileModal
          initial={profile}
          onClose={() => setShowProfile(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}