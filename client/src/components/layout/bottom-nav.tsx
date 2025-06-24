import { Home, Image, Video, ExternalLink, Settings } from "lucide-react";
import { useLocation } from "wouter";

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "홈" },
    { path: "/images", icon: Image, label: "이미지" },
    { path: "/videos", icon: Video, label: "동영상" },
    { path: "/links", icon: ExternalLink, label: "링크" },
    { path: "/settings", icon: Settings, label: "설정" },
  ];

  // Don't show bottom nav on landing and login pages
  if (location === "/" || location === "/login") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-stone-200/50 bottom-nav-shadow z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;

          return (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className={`flex flex-col items-center py-2 px-3 transition-all duration-200 rounded-lg ${
                isActive 
                  ? "text-amber-800 bg-amber-50/80" 
                  : "text-gray-500 hover:text-amber-800 hover:bg-stone-100/60"
              }`}
            >
              <Icon className="w-6 h-6 mb-1 transition-colors" />
              <span className="text-xs korean-text">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
