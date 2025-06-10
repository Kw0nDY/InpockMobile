import { useState, useEffect } from "react";
import { ChevronLeft, Camera, Image, Video, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MediaUpload } from "@/components/profile/media-upload";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: (user as any)?.bio || '',
    profileImageUrl: (user as any)?.profileImageUrl || '',
    introVideoUrl: (user as any)?.introVideoUrl || '',
    shortUrlType: 'default',
    customUrl: (user as any)?.customUrl || '',
    contentType: 'links',
    linkTitle: '',
    linkDescription: '',
    linkUrl: ''
  });

  const [copied, setCopied] = useState(false);

  // Fetch user settings
  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: [`/api/settings/${user?.id}`],
    enabled: !!user?.id,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest(
        "POST",
        `/api/settings/${user?.id}`,
        updates,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/settings/${user?.id}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/user/${user?.id}`],
      });
      // Removed individual success toast - handled centrally
    },
    onError: (error: any) => {
      console.error('Settings mutation error:', error);
      // Removed individual error toast - handled centrally
    },
  });

  // Update user profile mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PUT", `/api/user/${user?.id}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      // Update the user context with new data
      if (data.user && user) {
        setUser({ ...user, ...data.user });
      }
      queryClient.invalidateQueries({
        queryKey: [`/api/user/${user?.id}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/dashboard/stats/${user?.id}`],
      });
      // Removed individual success toast - handled centrally
    },
    onError: (error: any) => {
      console.error('User update error:', error);
      // Removed individual error toast - handled centrally
    },
  });

  // Sync with fetched settings
  useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      setProfileData(prev => ({
        ...prev,
        bio: (userSettings as any).bio || '',
        customUrl: (userSettings as any).customUrl || '',
        shortUrlType: (userSettings as any).customUrl ? 'custom' : 'default',
        contentType: (userSettings as any).contentType || 'links',
        linkTitle: (userSettings as any).linkTitle || '',
        linkDescription: (userSettings as any).linkDescription || '',
        linkUrl: (userSettings as any).linkUrl || ''
      }));
    }
  }, [userSettings]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleSaveProfile = async () => {
    try {
      console.log('Saving profile data:', profileData);
      console.log('User ID:', user?.id);
      
      // Save user profile data (name, email, bio, media URLs)
      if (user?.id) {
        const userUpdateData = {
          name: profileData.name,
          email: profileData.email,
          bio: profileData.bio,
          profileImageUrl: profileData.profileImageUrl,
          introVideoUrl: profileData.introVideoUrl,
        };
        console.log('User update data:', userUpdateData);
        const userResult = await updateUserMutation.mutateAsync(userUpdateData);
        console.log('User update result:', userResult);
      }

      // Save settings data (URLs, content type, link settings)
      const settingsUpdateData = {
        bio: profileData.bio,
        customUrl: profileData.customUrl,
        contentType: profileData.contentType,
        linkTitle: profileData.linkTitle,
        linkDescription: profileData.linkDescription,
        linkUrl: profileData.linkUrl,
      };
      console.log('Settings update data:', settingsUpdateData);
      const settingsResult = await updateSettingsMutation.mutateAsync(settingsUpdateData);
      console.log('Settings update result:', settingsResult);
      
      console.log('Profile saved successfully');
      
      // Show success message only after both operations complete
      toast({
        title: "프로필 저장 완료",
        description: "모든 설정이 성공적으로 저장되었습니다.",
      });
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "저장 실패",
        description: "프로필 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = () => {
    const url = profileData.shortUrlType === 'custom' && profileData.customUrl
      ? `amusefit.co.kr/users/${profileData.customUrl}`
      : `amusefit.co.kr/users/${user?.username || 'default'}`;
    
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "URL 복사됨",
      description: "단축 URL이 클립보드에 복사되었습니다.",
    });
  };

  const updateProfileData = (key: string, value: any) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
  };

  const handleMediaUpload = (fileUrl: string, mediaType: 'image' | 'video') => {
    const updateData = mediaType === 'image' 
      ? { profileImageUrl: fileUrl }
      : { introVideoUrl: fileUrl };
    
    // Update local state
    setProfileData(prev => ({ ...prev, ...updateData }));
    
    // Update user profile in database
    updateUserMutation.mutate(updateData);
  };

  const shortUrl = profileData.shortUrlType === 'custom' && profileData.customUrl
    ? `amusefit.co.kr/users/${profileData.customUrl}`
    : `amusefit.co.kr/users/${user?.username || 'default'}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-800">프로필 설정</h1>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={updateSettingsMutation.isPending}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {updateSettingsMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">프로필</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-xl">
                    {profileData.name ? getInitials(profileData.name) : getInitials(user?.name || '사용자')}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-600 hover:text-gray-800"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">프로필 사진</p>
                <p className="text-xs text-gray-500">클릭하여 이미지를 변경하세요</p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">이름</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => updateProfileData('name', e.target.value)}
                placeholder="이름을 입력하세요"
                className="border-gray-200 focus:border-primary"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">이메일</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => updateProfileData('email', e.target.value)}
                placeholder="이메일을 입력하세요"
                className="border-gray-200 focus:border-primary"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700">소개</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => updateProfileData('bio', e.target.value)}
                placeholder="자신을 소개해보세요"
                className="border-gray-200 focus:border-primary resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Short URL Setting */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">단축 URL 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={profileData.shortUrlType}
              onValueChange={(value) => updateProfileData('shortUrlType', value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <RadioGroupItem value="default" id="default" />
                <Label htmlFor="default" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-800">기본값</p>
                    <p className="text-sm text-gray-600">amusefit.co.kr/users/{user?.username || 'default'}</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-800">커스텀</p>
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">amusefit.co.kr/users/</span>
                        <Input
                          value={profileData.customUrl}
                          onChange={(e) => updateProfileData('customUrl', e.target.value)}
                          placeholder="yourname"
                          className="flex-1 h-8 text-sm border-gray-200 focus:border-primary"
                          disabled={profileData.shortUrlType !== 'custom'}
                        />
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* URL Preview & Copy */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">미리보기</p>
                  <p className="font-mono text-sm text-primary">{shortUrl}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyUrl}
                  className="text-gray-600 hover:text-primary"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Content Type Selection */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">콘텐츠 타입 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={profileData.contentType}
              onValueChange={(value) => updateProfileData('contentType', value)}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { value: 'image', label: '이미지', icon: Image },
                { value: 'video', label: '동영상', icon: Video },
                { value: 'links', label: '링크 카드', icon: ExternalLink }
              ].map(({ value, label, icon: Icon }) => (
                <div key={value} className="relative">
                  <RadioGroupItem value={value} id={value} className="sr-only" />
                  <Label
                    htmlFor={value}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      profileData.contentType === value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-2 ${
                      profileData.contentType === value ? 'text-primary' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      profileData.contentType === value ? 'text-primary' : 'text-gray-600'
                    }`}>
                      {label}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Image Upload Section */}
        {profileData.contentType === 'image' && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">이미지 콘텐츠 설정</CardTitle>
              <p className="text-sm text-gray-600">프로필에 표시될 이미지를 업로드하세요</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.id && (
                <MediaUpload
                  userId={user.id}
                  onUploadSuccess={handleMediaUpload}
                  currentImageUrl={profileData.profileImageUrl}
                  currentVideoUrl=""
                  uploadType="image"
                />
              )}
              

            </CardContent>
          </Card>
        )}

        {/* Video Upload Section */}
        {profileData.contentType === 'video' && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">동영상 콘텐츠 설정</CardTitle>
              <p className="text-sm text-gray-600">프로필에 표시될 동영상을 업로드하세요</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.id && (
                <MediaUpload
                  userId={user.id}
                  onUploadSuccess={handleMediaUpload}
                  currentImageUrl=""
                  currentVideoUrl={profileData.introVideoUrl}
                  uploadType="video"
                />
              )}
              
              {/* Video Preview */}
              {profileData.introVideoUrl && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">동영상 미리보기</p>
                  <div className="w-full max-w-md mx-auto">
                    <video
                      src={profileData.introVideoUrl}
                      controls
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">홈 화면에서 이 동영상이 표시됩니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Link Card Configuration Section */}
        {profileData.contentType === 'links' && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">링크 카드 콘텐츠 설정</CardTitle>
              <p className="text-sm text-gray-600">홈 화면에 표시될 링크 카드를 구성하세요</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkTitle" className="text-sm font-medium text-gray-700">링크 제목</Label>
                <Input
                  id="linkTitle"
                  value={profileData.linkTitle || ''}
                  onChange={(e) => updateProfileData('linkTitle', e.target.value)}
                  placeholder="링크 카드에 표시될 제목을 입력하세요"
                  className="border-gray-200 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="linkDescription" className="text-sm font-medium text-gray-700">링크 설명</Label>
                <Textarea
                  id="linkDescription"
                  value={profileData.linkDescription || ''}
                  onChange={(e) => updateProfileData('linkDescription', e.target.value)}
                  placeholder="링크에 대한 간단한 설명을 입력하세요"
                  className="border-gray-200 focus:border-primary resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="linkUrl" className="text-sm font-medium text-gray-700">링크 URL</Label>
                <Input
                  id="linkUrl"
                  type="url"
                  value={profileData.linkUrl || ''}
                  onChange={(e) => updateProfileData('linkUrl', e.target.value)}
                  placeholder="https://example.com"
                  className="border-gray-200 focus:border-primary"
                />
              </div>

              {/* Link Card Preview */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">링크 카드 미리보기</p>
                <div className="p-3 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow max-w-md mx-auto">
                  <div className="flex items-start space-x-3">
                    {profileData.profileImageUrl ? (
                      <img
                        src={profileData.profileImageUrl}
                        alt="Profile"
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium text-sm">
                          {profileData.name ? getInitials(profileData.name) : getInitials(user?.name || '사용자')}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-gray-800">
                          {profileData.linkTitle || `${profileData.name || user?.name || '사용자'}의 프로필`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {profileData.linkDescription || profileData.bio || '안녕하세요! 반갑습니다.'}
                      </p>
                      <div className="flex items-center space-x-1 mt-2 text-xs text-blue-600">
                        <span>{profileData.linkUrl || shortUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">홈 화면에서 이 링크 카드가 표시됩니다</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}