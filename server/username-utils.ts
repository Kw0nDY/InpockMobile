import type { DatabaseStorage } from "./storage";

export async function generateUniqueUsername(
  storage: DatabaseStorage, 
  baseUsername: string
): Promise<string> {
  // Sanitize the username: only allow Korean, English, numbers, underscore, hyphen
  const sanitized = baseUsername
    .replace(/[^a-zA-Z0-9가-힣_-]/g, '')
    .toLowerCase()
    .trim();
  
  if (!sanitized) {
    throw new Error("유효하지 않은 닉네임입니다");
  }

  // Check if base username is available
  const existingUser = await storage.getUserByUsername(sanitized);
  if (!existingUser) {
    return sanitized;
  }

  // If taken, try with numbers (up to 999)
  for (let i = 1; i <= 999; i++) {
    const candidate = `${sanitized}${i}`;
    const exists = await storage.getUserByUsername(candidate);
    if (!exists) {
      return candidate;
    }
  }

  // If all numbers are taken, use timestamp
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

  // Allow Korean, English, numbers, underscore, hyphen
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