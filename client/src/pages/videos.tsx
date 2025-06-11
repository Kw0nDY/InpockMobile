import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VideosPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Videos Section */}
      <div className="p-4 relative">
        {/* Add Button inside section */}
        <div className="absolute bottom-6 right-6 z-10">
          <Button className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="text-center py-20">
          <p className="text-gray-500 mb-2">아직 업로드된 동영상이 없습니다</p>
          <p className="text-sm text-gray-400">+ 버튼을 눌러 새 동영상을 추가해보세요</p>
        </div>
      </div>
    </div>
  );
}