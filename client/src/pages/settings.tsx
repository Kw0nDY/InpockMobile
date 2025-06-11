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

  // Custom links state
  const [customLinks, setCustomLinks] = useState<Array<{
    id?: number;
    title: string;
    url: string;
    shortCode: string;
    isEditing?: boolean;
  }>>([]);

  const [newLink, setNewLink] = useState({
    title: '',
    url: ''
  });

  // Generate short code from title
  const generateShortCode = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20) + '-' + Math.random().toString(36).substring(2, 6);
  };



  const [copied, setCopied] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [mediaImageUrl, setMediaImageUrl] = useState('');
  const [mediaVideoUrl, setMediaVideoUrl] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');

  // 기존 미디어 업로드 데이터를 불러오기
  const { data: mediaUploads } = useQuery({
    queryKey: [`/api/media/${user?.id}`],
    enabled: !!user?.id,
  });

  // Load existing links
  const { data: linksData } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
  });

  // Add link functions
  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast({
        title: "입력 오류",
        description: "제목과 URL을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "인증 오류",
        description: "로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    const shortCode = generateShortCode(newLink.title);
    createLinkMutation.mutate({
      title: newLink.title,
      originalUrl: newLink.url,
      shortCode,
      userId: user.id
    });
  };

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: async (linkData: { title: string; originalUrl: string; shortCode: string; userId: number }) => {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData)
      });
      if (!response.ok) throw new Error('Failed to create link');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/links/${user?.id}`],
      });
      setNewLink({ title: '', url: '' });
      toast({
        title: "링크 추가 완료",
        description: "새 링크가 성공적으로 추가되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "링크 추가 실패",
        description: "링크 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const response = await fetch(`/api/links/${linkId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete link');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/links/${user?.id}`],
      });
      toast({
        title: "링크 삭제 완료",
        description: "링크가 성공적으로 삭제되었습니다.",
      });
    }
  });

  // Copy URL function
  const handleCopyShortUrl = (shortCode: string) => {
    const url = `amusefit.co.kr/link/${shortCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL 복사 완료",
      description: "단축 URL이 클립보드에 복사되었습니다.",
    });
  };

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
        avatar: data.path
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
      avatar: null
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
    // 미디어 업로드는 별도 상태로 관리하여 프로필 이미지와 완전 분리
    if (mediaType === 'image') {
      setMediaImageUrl(fileUrl);
    } else {
      setMediaVideoUrl(fileUrl);
    }
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
                {(user as any)?.avatar ? (
                  <img
                    src={(user as any).avatar}
                    alt="프로필 이미지"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xl">
                      {profileData.name ? getInitials(profileData.name) : getInitials(user?.name || '사용자')}
                    </span>
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={handleProfileImageUpload}
                  disabled={isUploadingProfile}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  {isUploadingProfile ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
                {(user as any)?.avatar && (
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
                {(user as any)?.avatar && (
                  <p className="text-xs text-red-500 mt-1">빨간 버튼을 클릭하여 삭제할 수 있습니다</p>
                )}
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
            {/* Link Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkTitle" className="text-sm font-medium text-gray-700">링크 제목</Label>
                <Input
                  id="linkTitle"
                  value={profileData.linkTitle || ''}
                  onChange={(e) => updateProfileData('linkTitle', e.target.value)}
                  placeholder="링크 제목을 입력하세요"
                  className="border-gray-200 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkUrl" className="text-sm font-medium text-gray-700">링크 URL</Label>
                <Input
                  id="linkUrl"
                  value={profileData.linkUrl || ''}
                  onChange={(e) => updateProfileData('linkUrl', e.target.value)}
                  placeholder="https://example.com"
                  className="border-gray-200 focus:border-primary"
                />
              </div>
            </div>

            <RadioGroup
              value={profileData.shortUrlType}
              onValueChange={(value) => updateProfileData('shortUrlType', value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <RadioGroupItem value="default" id="default" />
                <Label htmlFor="default" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-800">기본 프로필 URL</p>
                    <p className="text-sm text-gray-600">amusefit.co.kr/users/{user?.username || 'default'}</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-800">커스텀 프로필 URL</p>
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

              {/* Link URL Option */}
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-800">링크 URL</p>
                    <p className="text-sm text-gray-600">
                      {profileData.linkTitle || '링크 제목을 입력하세요'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      amusefit.co.kr/link/{profileData.linkTitle ? profileData.linkTitle.toLowerCase().replace(/\s+/g, '-') : 'your-link'}
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* URL Preview & Copy */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">선택된 URL 미리보기</p>
                  {profileData.shortUrlType === 'link' && profileData.linkTitle ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{profileData.linkTitle}</p>
                      <p className="font-mono text-sm text-primary">
                        amusefit.co.kr/link/{profileData.linkTitle.toLowerCase().replace(/\s+/g, '-')}
                      </p>
                    </div>
                  ) : (
                    <p className="font-mono text-sm text-primary">{shortUrl}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    let urlToCopy;
                    if (profileData.shortUrlType === 'link' && profileData.linkTitle) {
                      urlToCopy = `amusefit.co.kr/link/${profileData.linkTitle.toLowerCase().replace(/\s+/g, '-')}`;
                    } else {
                      urlToCopy = shortUrl;
                    }
                    navigator.clipboard.writeText(urlToCopy);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast({
                      title: "URL 복사됨",
                      description: "선택된 URL이 클립보드에 복사되었습니다.",
                    });
                  }}
                  className="text-gray-600 hover:text-primary"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>


          </CardContent>
        </Card>



        {/* Custom Link URLs Management */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">커스텀 링크 URL 관리</CardTitle>
            <p className="text-sm text-gray-600">여러 개의 단축 URL을 생성하고 관리하세요</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Link Form */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-800 mb-3">새 링크 추가</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="newLinkTitle" className="text-sm font-medium text-gray-700">
                    링크 제목
                  </Label>
                  <Input
                    id="newLinkTitle"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    placeholder="예: 내 포트폴리오"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="newLinkUrl" className="text-sm font-medium text-gray-700">
                    원본 URL
                  </Label>
                  <Input
                    id="newLinkUrl"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
                </div>
                {newLink.title && (
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">생성될 단축 URL:</p>
                    <p className="font-mono text-sm text-blue-800 break-all">
                      amusefit.co.kr/link/{generateShortCode(newLink.title)}
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleAddLink}
                  disabled={!newLink.title.trim() || !newLink.url.trim() || createLinkMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {createLinkMutation.isPending ? '추가 중...' : '링크 추가'}
                </Button>
              </div>
            </div>

            {/* Existing Links List */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800">기존 링크 목록</h3>
              {linksData && Array.isArray(linksData) && linksData.length > 0 ? (
                linksData.map((link: any) => (
                  <div key={link.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{link.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 break-all">{link.originalUrl}</p>
                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 mb-1">단축 URL:</p>
                              <p className="font-mono text-sm text-primary break-all">
                                amusefit.co.kr/link/{link.shortCode}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyShortUrl(link.shortCode)}
                                className="text-gray-600 hover:text-primary p-2"
                                title="URL 복사"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(link.originalUrl, '_blank')}
                                className="text-gray-600 hover:text-primary p-2"
                                title="링크 열기"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {link.clicks > 0 && (
                          <p className="text-xs text-gray-500 mt-2">클릭 수: {link.clicks}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteLinkMutation.mutate(link.id)}
                        disabled={deleteLinkMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 p-2"
                        title="링크 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ExternalLink className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">아직 생성된 링크가 없습니다</p>
                  <p className="text-xs text-gray-400">위 양식을 사용하여 첫 번째 링크를 추가해보세요</p>
                </div>
              )}
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



        {/* 계정 관리 섹션 */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">계정 관리</CardTitle>
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