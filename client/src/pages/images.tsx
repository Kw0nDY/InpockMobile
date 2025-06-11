import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImagesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Floating Add Button */}
      <div className="fixed bottom-24 right-4 z-50">
        <Button className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg">
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <div className="p-4">
        <div className="text-center py-20">
          <p className="text-gray-500 mb-2">아직 업로드된 이미지가 없습니다</p>
          <p className="text-sm text-gray-400">+ 버튼을 눌러 새 이미지를 추가해보세요</p>
        </div>
      </div>
    </div>
  );
}