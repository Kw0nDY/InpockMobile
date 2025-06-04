import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Plus,
  Filter,
  Star,
  UserPlus
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  tags: string[];
  isFavorite: boolean;
  lastContact: string;
  avatar?: string;
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "김민수",
    email: "minsu.kim@techcorp.kr",
    phone: "010-1234-5678",
    company: "테크코퍼레이션",
    position: "마케팅 디렉터",
    location: "서울, 대한민국",
    tags: ["마케팅", "파트너"],
    isFavorite: true,
    lastContact: "2일 전"
  },
  {
    id: "2",
    name: "이지은",
    email: "jieun.lee@startup.io",
    phone: "010-9876-5432",
    company: "스타트업 인큐베이터",
    position: "투자 매니저",
    location: "강남구, 서울",
    tags: ["투자", "스타트업"],
    isFavorite: false,
    lastContact: "1주 전"
  },
  {
    id: "3",
    name: "박정호",
    email: "jungho.park@design.co.kr",
    phone: "010-5555-7777",
    company: "크리에이티브 디자인",
    position: "UI/UX 디자이너",
    location: "홍대, 서울",
    tags: ["디자인", "외주"],
    isFavorite: true,
    lastContact: "3일 전"
  },
  {
    id: "4",
    name: "최수연",
    email: "suyeon.choi@media.com",
    phone: "010-3333-4444",
    company: "미디어 그룹",
    position: "콘텐츠 매니저",
    location: "성수동, 서울",
    tags: ["미디어", "콘텐츠"],
    isFavorite: false,
    lastContact: "5일 전"
  },
  {
    id: "5",
    name: "장영희",
    email: "younghee.jang@consulting.kr",
    phone: "010-7777-8888",
    company: "비즈니스 컨설팅",
    position: "시니어 컨설턴트",
    location: "여의도, 서울",
    tags: ["컨설팅", "전략"],
    isFavorite: false,
    lastContact: "1주 전"
  },
  {
    id: "6",
    name: "한도윤",
    email: "doyoon.han@ecommerce.co.kr",
    phone: "010-2222-3333",
    company: "이커머스 플랫폼",
    position: "프로덕트 매니저",
    location: "판교, 성남",
    tags: ["이커머스", "제품"],
    isFavorite: true,
    lastContact: "어제"
  }
];

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts] = useState(mockContacts);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFavorites = showFavoritesOnly ? contact.isFavorite : true;
    
    return matchesSearch && matchesFavorites;
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getTagColor = (tag: string) => {
    const colors = {
      "마케팅": "bg-orange-100 text-orange-800",
      "파트너": "bg-blue-100 text-blue-800",
      "투자": "bg-green-100 text-green-800",
      "스타트업": "bg-purple-100 text-purple-800",
      "디자인": "bg-pink-100 text-pink-800",
      "외주": "bg-gray-100 text-gray-800",
      "미디어": "bg-red-100 text-red-800",
      "콘텐츠": "bg-yellow-100 text-yellow-800",
      "컨설팅": "bg-indigo-100 text-indigo-800",
      "전략": "bg-teal-100 text-teal-800",
      "이커머스": "bg-emerald-100 text-emerald-800",
      "제품": "bg-cyan-100 text-cyan-800"
    };
    return colors[tag as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        title="연락처" 
        rightAction={{
          text: "추가",
          onClick: () => {}
        }}
      />

      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="이름, 회사, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Filter Options */}
        <div className="flex items-center space-x-3">
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center space-x-2 ${
              showFavoritesOnly ? "bg-orange-600 text-white" : ""
            }`}
          >
            <Star className="w-4 h-4" />
            <span>즐겨찾기</span>
          </Button>
          
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>필터</span>
          </Button>

          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>초대</span>
          </Button>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredContacts.length}명의 연락처
          </p>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-xs text-gray-500"
            >
              검색 초기화
            </Button>
          )}
        </div>

        {/* Contact Cards */}
        <div className="space-y-3">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-800 truncate">
                              {contact.name}
                            </h3>
                            {contact.isFavorite && (
                              <Star className="w-4 h-4 text-orange-500 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {contact.position} • {contact.company}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 ml-2">
                          {contact.lastContact}
                        </p>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{contact.location}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {contact.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className={`text-xs ${getTagColor(tag)}`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm" className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>통화</span>
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>메일</span>
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center space-x-1">
                          <Plus className="w-3 h-3" />
                          <span>메모</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600 mb-4">
                다른 검색어를 시도하거나 필터를 조정해보세요.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setShowFavoritesOnly(false);
                }}
                className="bg-orange-600 text-white"
              >
                모든 연락처 보기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}