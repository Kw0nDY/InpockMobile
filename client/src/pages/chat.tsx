import { useState } from "react";
import { Edit, Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: chats, isLoading } = useQuery({
    queryKey: [`/api/chats/${user?.id}`],
    enabled: !!user?.id,
  });

  const handleOpenChat = (chatName: string) => {
    toast({
      title: "채팅방 열기",
      description: `${chatName}와의 채팅방으로 이동합니다.`,
    });
  };

  const filteredChats = chats?.filter((chat: any) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="채팅" rightIcon={Edit} />

      <div className="p-4">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="대화 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
          </div>
        </div>

        {/* Chat List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="space-y-4">
            {filteredChats.map((chat: any) => (
              <button
                key={chat.id}
                onClick={() => handleOpenChat(chat.name)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                      chat.initials === "마케" ? "bg-primary" :
                      chat.initials === "디자" ? "bg-blue-500" :
                      chat.initials === "개발" ? "bg-green-500" :
                      "bg-purple-500"
                    }`}
                  >
                    <span className="text-white font-medium text-sm">{chat.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate korean-text">{chat.name}</p>
                      <span className="text-xs text-gray-500">{chat.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate korean-text">{chat.lastMessage}</p>
                  </div>
                </div>
                {chat.unread && (
                  <div className="flex flex-col items-end ml-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : searchQuery ? (
          // Search results empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-600 mb-2 korean-text">검색 결과가 없습니다</h3>
            <p className="text-sm text-gray-500 korean-text">다른 키워드로 검색해보세요</p>
          </div>
        ) : (
          // No chats empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-600 mb-2 korean-text">아직 대화가 없습니다</h3>
            <p className="text-sm text-gray-500 korean-text">새로운 비즈니스 파트너와 대화를 시작해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
