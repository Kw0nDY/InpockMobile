import { useState, useEffect } from "react";
import { ChevronLeft, Camera, Image, Video, ExternalLink, Copy, Check, LogOut, Trash2, Plus } from "lucide-react";
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
import { ImageCropModal } from '@/components/ui/image-crop-modal';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
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
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [mediaImageUrl, setMediaImageUrl] = useState('');
  const [mediaVideoUrl, setMediaVideoUrl] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [urlValidation, setUrlValidation] = useState({
    linkUrl: { isValid: true, message: '' },
    mediaImageUrl: { isValid: true, message: '' },
    mediaVideoUrl: { isValid: true, message: '' }
  });

  // URL 유효성 검사 함수
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateImageUrl = async (url: string): Promise<{ isValid: boolean; message: string }> => {
    if (!url.trim()) return { isValid: true, message: '' };
    
    if (!validateUrl(url)) {
      return { isValid: false, message: '유효하지 않은 URL 형식입니다' };
    }

    // 이미지 URL 패턴 검사
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    if (!imageExtensions.test(url)) {
      return { isValid: false, message: '이미지 파일 확장자가 필요합니다 (.jpg, .png, .gif 등)' };
    }
    
    return { isValid: true, message: '' };
  };

  const validateVideoUrl = async (url: string): Promise<{ isValid: boolean; message: string }> => {
    if (!url.trim()) return { isValid: true, message: '' };
    
    if (!validateUrl(url)) {
      return { isValid: false, message: '유효하지 않은 URL 형식입니다' };
    }

    // 동영상 URL 패턴 검사
    const videoExtensions = /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)(\?.*)?$/i;
    const videoServices = /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i;
    
    if (!videoExtensions.test(url) && !videoServices.test(url)) {
      return { isValid: false, message: '동영상 파일 또는 동영상 서비스 URL이 필요합니다' };
    }
    
    return { isValid: true, message: '' };
  };

  const validateLinkUrl = async (url: string): Promise<{ isValid: boolean; message: string }> => {
    if (!url.trim()) return { isValid: true, message: '' };
    
    if (!validateUrl(url)) {
      return { isValid: false, message: '유효하지 않은 URL 형식입니다' };
    }

    // URL이 http 또는 https로 시작하는지 확인
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { isValid: false, message: 'http:// 또는 https://로 시작해야 합니다' };
    }
    
    return { isValid: true, message: '' };
  };

  // URL 유효성 검사 실행
  const handleUrlValidation = async (field: string, url: string) => {
    let validation;
    
    switch (field) {
      case 'mediaImageUrl':
        validation = await validateImageUrl(url);
        break;
      case 'mediaVideoUrl':
        validation = await validateVideoUrl(url);
        break;
      case 'linkUrl':
        validation = await validateLinkUrl(url);
        break;
      default:
        return;
    }
    
    setUrlValidation(prev => ({
      ...prev,
      [field]: validation
    }));
  };

  // 기존 미디어 업로드 데이터를 불러오기
  const { data: mediaUploads } = useQuery({
    queryKey: [`/api/media/${user?.id}`],
    enabled: !!user?.id,
  });



  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: [`/api/user/${user?.id}`],
    enabled: !!user?.id,
  });

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
    },
    onError: (error: any) => {
      console.error('Settings mutation error:', error);
    },
  });

  // Update user profile mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PUT", `/api/user/${user?.id}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user && user) {
        setUser({ ...user, ...data.user });
      }
      queryClient.invalidateQueries({
        queryKey: [`/api/user/${user?.id}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/dashboard/stats/${user?.id}`],
      });
    },
    onError: (error: any) => {
      console.error('User update error:', error);
    },
  });

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File | Blob) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      updateUserMutation.mutate({
        profileImageUrl: data.path
      });
      
      toast({
        title: "프로필 이미지 업데이트",
        description: "프로필 이미지가 성공적으로 변경되었습니다.",
      });
      setIsUploadingProfile(false);
    },
    onError: (error: any) => {
      console.error('Profile image upload error:', error);
      toast({
        title: "업로드 실패",
        description: "이미지 업로드에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      setIsUploadingProfile(false);
    },
  });

  // Fetch links
  const { data: links } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
  });



  // Sync with fetched settings
  useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      setProfileData(prev => ({
        ...prev,
        bio: (userSettings as any).bio || '',
        customUrl: (userSettings as any).customUrl || '',
        shortUrlType: (userSettings as any).shortUrlType || 'default',
        contentType: (userSettings as any).contentType || 'links',
        linkTitle: (userSettings as any).linkTitle || '',
        linkDescription: (userSettings as any).linkDescription || '',
        linkUrl: (userSettings as any).linkUrl || ''
      }));
    }
  }, [userSettings]);

  // 미디어 업로드 데이터 동기화
  useEffect(() => {
    if (mediaUploads && Array.isArray(mediaUploads)) {
      const imageUpload = mediaUploads.find((media: any) => media.mediaType === 'image');
      const videoUpload = mediaUploads.find((media: any) => media.mediaType === 'video');
      
      if (imageUpload) {
        setMediaImageUrl(imageUpload.filePath);
      }
      if (videoUpload) {
        setMediaVideoUrl(videoUpload.filePath);
      }
    }
  }, [mediaUploads]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleProfileImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // 임시 이미지 URL 생성하여 자르기 모달에 표시
        const imageUrl = URL.createObjectURL(file);
        setTempImageUrl(imageUrl);
        setCropModalOpen(true);
      }
    };
    input.click();
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setIsUploadingProfile(true);
    uploadProfileImageMutation.mutate(croppedBlob);
    
    // 임시 URL 정리
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl('');
    }
  };

  const handleDeleteProfileImage = () => {
    updateUserMutation.mutate({
      profileImageUrl: null
    });
    
    toast({
      title: "프로필 이미지 삭제",
      description: "프로필 이미지가 성공적으로 삭제되었습니다.",
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "로그아웃 완료",
      description: "성공적으로 로그아웃되었습니다.",
    });
    setLocation('/login');
  };

  const handleCropCancel = () => {
    // 임시 URL 정리
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl('');
    }
    setCropModalOpen(false);
  };

  const handleSaveProfile = async () => {
    try {
      console.log('Saving profile data:', profileData);
      console.log('User ID:', user?.id);
      
      if (user?.id) {
        const userUpdateData = {
          name: profileData.name,
          email: profileData.email,
          bio: profileData.bio,
          introVideoUrl: profileData.introVideoUrl,
        };
        console.log('User update data:', userUpdateData);
        const userResult = await updateUserMutation.mutateAsync(userUpdateData);
        console.log('User update result:', userResult);
      }

      const settingsUpdateData = {
        bio: profileData.bio,
        customUrl: profileData.customUrl,
        contentType: profileData.contentType,
        linkTitle: profileData.linkTitle,
        linkDescription: profileData.linkDescription,
        linkUrl: profileData.linkUrl,
        shortUrlType: profileData.shortUrlType,
      };
      console.log('Settings update data:', settingsUpdateData);
      const settingsResult = await updateSettingsMutation.mutateAsync(settingsUpdateData);
      console.log('Settings update result:', settingsResult);

      // If content type is image or video and URL is provided, save to media API
      if ((profileData.contentType === 'image' || profileData.contentType === 'video') && profileData.linkUrl) {
        try {
          const mediaData = {
            userId: user?.id,
            mediaUrl: profileData.linkUrl,
            mediaType: profileData.contentType,
            title: profileData.linkTitle || null,
            description: profileData.linkDescription || null,
          };
          console.log('Saving media data:', mediaData);
          
          const response = await fetch('/api/media', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mediaData),
          });
          
          if (response.ok) {
            const mediaResult = await response.json();
            console.log('Media save result:', mediaResult);
            // Invalidate media query to refresh the data
            queryClient.invalidateQueries({ queryKey: ['/api/media', user?.id] });
          } else {
            console.error('Media save failed:', await response.text());
          }
        } catch (mediaError) {
          console.error('Media save error:', mediaError);
        }
      }
      
      console.log('Profile saved successfully');
      
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
      ? `${window.location.origin}/${profileData.customUrl}`
      : `${window.location.origin}/users/${user?.username || 'demo_user'}`;
    
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
    // 미디어 업로드는 별도 상태로 관리하여 프로필 이미지와 완전 분리
    if (mediaType === 'image') {
      setMediaImageUrl(fileUrl);
    } else {
      setMediaVideoUrl(fileUrl);
    }
  };

  const shortUrl = profileData.shortUrlType === 'custom' && profileData.customUrl
    ? `${window.location.host}/${profileData.customUrl}`
    : `${window.location.host}/${user?.username || 'demo_user'}`;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">프로필 설정</h1>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={updateSettingsMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {updateSettingsMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <Card className="bg-card shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">프로필</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                {(userData as any)?.profileImageUrl ? (
                  <img
                    src={(userData as any).profileImageUrl}
                    alt="프로필 이미지"
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-medium text-xl">
                      {profileData.name ? getInitials(profileData.name) : getInitials(user?.name || '사용자')}
                    </span>
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={handleProfileImageUpload}
                  disabled={isUploadingProfile}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border-2 border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {isUploadingProfile ? (
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
                {(userData as any)?.profileImageUrl && (
                  <Button
                    size="sm"
                    onClick={handleDeleteProfileImage}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white text-white hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">프로필 사진</p>
                <p className="text-xs text-gray-500">클릭하여 이미지를 변경하세요</p>
                {(userData as any)?.profileImageUrl && (
                  <p className="text-xs text-red-500 mt-1">빨간 버튼을 클릭하여 삭제할 수 있습니다</p>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">이름</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => updateProfileData('name', e.target.value)}
                placeholder="이름을 입력하세요"
                className="border-border focus:border-primary bg-background"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">이메일</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => updateProfileData('email', e.target.value)}
                placeholder="이메일을 입력하세요"
                className="border-border focus:border-primary bg-background"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-foreground">소개</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => updateProfileData('bio', e.target.value)}
                placeholder="자신을 소개해보세요"
                className="border-border focus:border-primary resize-none bg-background"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>







        {/* Short URL Settings */}
        <Card className="bg-card shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">단축 URL 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={profileData.shortUrlType}
              onValueChange={(value) => updateProfileData('shortUrlType', value)}
              className="space-y-4"
            >
              {/* 기본값 옵션 */}
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="default" id="default" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="default" className="cursor-pointer block">
                    <div className="font-medium text-foreground mb-1">기본값</div>
                    <div className="text-sm text-muted-foreground break-all">
                      {window.location.host}/{user?.username || 'demo_user'}
                    </div>
                  </Label>
                </div>
              </div>
              
              {/* 커스텀 옵션 */}
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="custom" className="cursor-pointer block">
                    <div className="font-medium text-foreground mb-1">커스텀</div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <span className="break-all">{window.location.host}/</span>
                        <Input
                          value={profileData.customUrl || ''}
                          onChange={(e) => updateProfileData('customUrl', e.target.value)}
                          placeholder="kimyolee"
                          className="ml-0 inline-block w-24 h-6 text-sm border border-gray-300 rounded px-2 bg-background disabled:opacity-50 disabled:bg-gray-100"
                          disabled={profileData.shortUrlType !== 'custom'}
                        />
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* URL Display & Copy */}
            <div className="p-4 bg-muted rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">단축링크</div>
                  <div className="text-sm text-foreground font-mono break-all pr-2">{shortUrl}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 border-border flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entry Type Selection */}
        <Card className="bg-card shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">진입 타입 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => updateProfileData('contentType', 'image')}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  profileData.contentType === 'image'
                    ? 'border-[#B08A6B] bg-[#f0e6d6]'
                    : 'border-border hover:border-[#B08A6B]'
                }`}
              >
                <Image className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">이미지</span>
              </button>
              
              <button
                onClick={() => updateProfileData('contentType', 'video')}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  profileData.contentType === 'video'
                    ? 'border-[#B08A6B] bg-[#f0e6d6]'
                    : 'border-border hover:border-[#B08A6B]'
                }`}
              >
                <Video className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">동영상</span>
              </button>
              
              <button
                onClick={() => updateProfileData('contentType', 'links')}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  profileData.contentType === 'links'
                    ? 'border-[#B08A6B] bg-[#f0e6d6]'
                    : 'border-border hover:border-[#B08A6B]'
                }`}
              >
                <ExternalLink className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">링크 카드</span>
              </button>
            </div>
          </CardContent>
        </Card>




        {/* 계정 관리 섹션 */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">계정 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start space-x-3">
                <LogOut className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800 mb-1">로그아웃</h3>
                  <p className="text-sm text-red-600 mb-3">
                    현재 계정에서 로그아웃합니다. 다시 로그인하려면 로그인 페이지에서 인증이 필요합니다.
                  </p>
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    로그아웃
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이미지 자르기 모달 */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={handleCropCancel}
        imageUrl={tempImageUrl}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}