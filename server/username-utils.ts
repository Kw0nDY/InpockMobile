import type { DatabaseStorage } from "./storage";

// 유연한 사용자명 검색 (기존 username-matcher 기능 통합)
export async function findUserByFlexibleUsername(
  storage: DatabaseStorage, 
  inputUsername: string
): Promise<any> {
  // 정확한 매칭 시도
  let user = await storage.getUserByUsername(inputUsername);
  if (user) return user;

  // 자동생성 닉네임 패턴 검색 최적화
  const pattern = new RegExp(`^${inputUsername}_\\d+$`);
  const allUsers = await storage.getAllUsers();
  const matchingUsers = allUsers.filter(u => pattern.test(u.username));
  
  // 가장 최근 사용자 반환 (높은 ID 기준)
  return matchingUsers.length > 0 
    ? matchingUsers.sort((a, b) => b.id - a.id)[0] 
    : null;
}

export async function generateUniqueUsername(
  storage: DatabaseStorage, 
  baseUsername: string
): Promise<string> {
  const sanitized = baseUsername
    .replace(/[^a-zA-Z0-9가-힣_-]/g, '')
    .toLowerCase()
    .trim();
  
  if (!sanitized) {
    throw new Error("유효하지 않은 닉네임입니다");
  }

  // 기본 닉네임 사용 가능성 확인
  const existingUser = await storage.getUserByUsername(sanitized);
  if (!existingUser) return sanitized;

  // 효율적인 중복 검사를 위한 배치 처리
  const candidates = Array.from({ length: 999 }, (_, i) => `${sanitized}${i + 1}`);
  
  for (const candidate of candidates) {
    const exists = await storage.getUserByUsername(candidate);
    if (!exists) return candidate;
  }

  // 타임스탬프 백업
  const timestamp = Date.now().toString().slice(-6);
  return `${sanitized}_${timestamp}`;
}

export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username) {
    return { valid: false, message: "닉네임을 입력해주세요" };
  }

  if (username.length < 2) {
    return { valid: false, message: "닉네임은 2자 이상이어야 합니다" };
  }

  if (username.length > 20) {
    return { valid: false, message: "닉네임은 20자 이하여야 합니다" };
  }

  // 한글, 영문, 숫자, 언더스코어, 하이픈 허용
  const validPattern = /^[a-zA-Z0-9가-힣_-]+$/;
  if (!validPattern.test(username)) {
    return { valid: false, message: "닉네임은 한글, 영문, 숫자, _, - 만 사용 가능합니다" };
  }

  // Don't allow username starting or ending with special characters
  if (username.startsWith('_') || username.startsWith('-') || 
      username.endsWith('_') || username.endsWith('-')) {
    return { valid: false, message: "닉네임은 특수문자로 시작하거나 끝날 수 없습니다" };
  }

  return { valid: true };
}