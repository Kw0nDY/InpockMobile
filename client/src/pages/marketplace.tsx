import { useState } from "react";
import { Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";

export default function MarketplacePage() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("전체");

  const { data: deals, isLoading } = useQuery({
    queryKey: [`/api/deals`, activeCategory],
    queryFn: () => 
      fetch(`/api/deals?category=${encodeURIComponent(activeCategory)}`)
        .then(res => res.json()),
  });

  const categories = ["전체", "신규", "인기"];

  const handleViewDeal = (dealId: number) => {
    toast({
      title: "딜 상세 정보",
      description: "딜 상세 페이지로 이동합니다.",
    });
  };

  const handleCreateDeal = () => {
    toast({
      title: "딜 등록",
      description: "새 딜 등록 페이지로 이동합니다.",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="딜 마켓" rightIcon={Search} />

      {/* Category Tabs */}
      <div className="flex bg-white border-b border-gray-100">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-1 py-3 text-center font-medium text-sm korean-text ${
              activeCategory === category
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Deal Cards */}
        <div className="space-y-4 mb-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded mb-3"></div>
                    <div className="flex justify-between">
                      <div className="h-8 w-24 bg-gray-200 rounded"></div>
                      <div className="h-8 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : deals && deals.length > 0 ? (
            deals.map((deal: any) => (
              <Card key={deal.id} className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-1 korean-text">{deal.title}</h3>
                      <p className="text-primary font-bold text-xl">
                        {formatPrice(deal.price)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      deal.category === "신규" 
                        ? "badge-new" 
                        : deal.category === "인기"
                        ? "badge-popular"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {deal.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 korean-text line-clamp-2">
                    {deal.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                      <div>
                        <p className="text-sm font-medium korean-text">{deal.company}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Star className="w-3 h-3 text-yellow-400 mr-1 fill-current" />
                          <span>{deal.rating} ({deal.reviews})</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleViewDeal(deal.id)}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
                    >
                      자세히 보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Empty state
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-600 mb-2 korean-text">검색 결과가 없습니다</h3>
              <p className="text-sm text-gray-500 korean-text">다른 카테고리를 선택해보세요</p>
            </div>
          )}
        </div>

        {/* Create Deal Button */}
        <Button
          onClick={handleCreateDeal}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
        >
          새 딜 등록하기
        </Button>
      </div>
    </div>
  );
}
