import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, UserSettings } from "@shared/schema";
import { Upload, User as UserIcon, Save, Eye } from "lucide-react";

export default function ProfileSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Get user settings
  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: [`/api/settings/${user?.id}`],
    enabled: !!user?.id,
  });

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    birthDate: "",
    fitnessAwards: "",
    fitnessCertifications: "",
    currentGym: "",
    gymAddress: "",
    fitnessIntro: "",
    profileImageUrl: "",
  });

  // Settings form state
  const [settingsData, setSettingsData] = useState({
    showProfileImage: true,
    showBio: true,
    showVisitCount: true,
    backgroundTheme: "beige",
    layoutStyle: "centered",
  });

  // Initialize form data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        bio: user.bio || "",
        birthDate: user.birthDate || "",
        fitnessAwards: user.fitnessAwards || "",
        fitnessCertifications: user.fitnessCertifications || "",
        currentGym: user.currentGym || "",
        gymAddress: user.gymAddress || "",
        fitnessIntro: user.fitnessIntro || "",
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      setSettingsData({
        showProfileImage: settings.showProfileImage ?? true,
        showBio: settings.showBio ?? true,
        showVisitCount: settings.showVisitCount ?? true,
        backgroundTheme: settings.backgroundTheme || "beige",
        layoutStyle: settings.layoutStyle || "centered",
      });
    }
  }, [settings]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      return await apiRequest(`/api/user/${user?.id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "업데이트 실패",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settingsData) => {
      return await apiRequest(`/api/settings/${user?.id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "설정 업데이트 완료",
        description: "화면 설정이 성공적으로 업데이트되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/settings/${user?.id}`] });
    },
    onError: () => {
      toast({
        title: "설정 업데이트 실패",
        description: "설정 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleSettingsSave = () => {
    updateSettingsMutation.mutate(settingsData);
  };

  const handlePreview = () => {
    if (user?.username) {
      window.open(`/users/${user.username}`, '_blank');
    }
  };

  if (userLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">프로필 설정</h1>
          <p className="text-gray-600">이용자 화면에 표시될 프로필 정보를 설정하세요</p>
        </div>
        <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          미리보기
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">기본 정보</TabsTrigger>
          <TabsTrigger value="display">화면 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                기본 프로필 정보
              </CardTitle>
              <CardDescription>
                이용자 화면에 표시될 기본 프로필 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">생년월일</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">소개</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="자신을 소개하는 글을 작성하세요"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileImageUrl">프로필 이미지 URL</Label>
                <Input
                  id="profileImageUrl"
                  value={profileData.profileImageUrl}
                  onChange={(e) => setProfileData({ ...profileData, profileImageUrl: e.target.value })}
                  placeholder="프로필 이미지 URL을 입력하세요"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>피트니스 정보</CardTitle>
              <CardDescription>
                피트니스 관련 상세 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentGym">현재 헬스장</Label>
                  <Input
                    id="currentGym"
                    value={profileData.currentGym}
                    onChange={(e) => setProfileData({ ...profileData, currentGym: e.target.value })}
                    placeholder="현재 다니는 헬스장"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gymAddress">헬스장 주소</Label>
                  <Input
                    id="gymAddress"
                    value={profileData.gymAddress}
                    onChange={(e) => setProfileData({ ...profileData, gymAddress: e.target.value })}
                    placeholder="헬스장 주소"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitnessAwards">수상 경력</Label>
                <Textarea
                  id="fitnessAwards"
                  value={profileData.fitnessAwards}
                  onChange={(e) => setProfileData({ ...profileData, fitnessAwards: e.target.value })}
                  placeholder="피트니스 관련 수상 경력을 입력하세요"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitnessCertifications">자격증</Label>
                <Textarea
                  id="fitnessCertifications"
                  value={profileData.fitnessCertifications}
                  onChange={(e) => setProfileData({ ...profileData, fitnessCertifications: e.target.value })}
                  placeholder="보유한 피트니스 자격증을 입력하세요"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitnessIntro">피트니스 소개</Label>
                <Textarea
                  id="fitnessIntro"
                  value={profileData.fitnessIntro}
                  onChange={(e) => setProfileData({ ...profileData, fitnessIntro: e.target.value })}
                  placeholder="피트니스 경험과 전문 분야를 소개하세요"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleProfileSave} 
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateProfileMutation.isPending ? "저장 중..." : "프로필 저장"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>화면 표시 설정</CardTitle>
              <CardDescription>
                이용자 화면에서 어떤 정보를 표시할지 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>프로필 이미지 표시</Label>
                    <p className="text-sm text-gray-500">프로필 이미지를 화면에 표시합니다</p>
                  </div>
                  <Switch
                    checked={settingsData.showProfileImage}
                    onCheckedChange={(checked) => 
                      setSettingsData({ ...settingsData, showProfileImage: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>소개글 표시</Label>
                    <p className="text-sm text-gray-500">프로필 소개글을 화면에 표시합니다</p>
                  </div>
                  <Switch
                    checked={settingsData.showBio}
                    onCheckedChange={(checked) => 
                      setSettingsData({ ...settingsData, showBio: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>방문자 수 표시</Label>
                    <p className="text-sm text-gray-500">프로필 방문자 수를 화면에 표시합니다</p>
                  </div>
                  <Switch
                    checked={settingsData.showVisitCount}
                    onCheckedChange={(checked) => 
                      setSettingsData({ ...settingsData, showVisitCount: checked })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>배경 테마</Label>
                  <Select
                    value={settingsData.backgroundTheme}
                    onValueChange={(value) => 
                      setSettingsData({ ...settingsData, backgroundTheme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beige">베이지</SelectItem>
                      <SelectItem value="white">화이트</SelectItem>
                      <SelectItem value="dark">다크</SelectItem>
                      <SelectItem value="gradient">그라디언트</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>레이아웃 스타일</Label>
                  <Select
                    value={settingsData.layoutStyle}
                    onValueChange={(value) => 
                      setSettingsData({ ...settingsData, layoutStyle: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="centered">중앙 정렬</SelectItem>
                      <SelectItem value="fullwidth">전체 너비</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSettingsSave} 
              disabled={updateSettingsMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateSettingsMutation.isPending ? "저장 중..." : "설정 저장"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}