import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: string;
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "프로필 업데이트 완료",
    message: "프로필 정보가 성공적으로 업데이트되었습니다.",
    type: "success",
    timestamp: "방금 전",
    isRead: false,
  },
  {
    id: "2",
    title: "새 메시지 도착",
    message: "마케팅랩 담당자로부터 새 메시지가 도착했습니다.",
    type: "info",
    timestamp: "5분 전",
    isRead: false,
  },
  {
    id: "3",
    title: "링크 클릭 알림",
    message: "공유한 링크가 10회 클릭되었습니다.",
    type: "info",
    timestamp: "1시간 전",
    isRead: true,
  },
  {
    id: "4",
    title: "구독 만료 예정",
    message: "Premium 구독이 3일 후 만료됩니다.",
    type: "warning",
    timestamp: "2시간 전",
    isRead: false,
  },
  {
    id: "5",
    title: "새 거래 제안",
    message: "새로운 비즈니스 거래 제안이 도착했습니다.",
    type: "info",
    timestamp: "어제",
    isRead: true,
  },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell className="w-5 h-5 text-primary" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full p-0">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className={`absolute right-0 top-12 w-80 max-h-96 z-50 shadow-lg border bg-white transform transition-all duration-200 ease-out ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">알림</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    모두 읽음
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-800 truncate">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">새로운 알림이 없습니다</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}