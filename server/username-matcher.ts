import type { DatabaseStorage } from "./storage";

export async function findUserByFlexibleUsername(
  storage: DatabaseStorage, 
  inputUsername: string
): Promise<any> {
  // 먼저 정확한 매칭 시도
  let user = await storage.getUserByUsername(inputUsername);
  if (user) {
    return user;
  }

  // 정확한 매칭이 없으면 자동생성 닉네임 패턴으로 검색
  // 입력 닉네임 + 언더스코어 + 숫자 형태
  const allUsers = await storage.getAllUsers();
  
  // 패턴 찾기: inputUsername_[숫자들]
  const pattern = new RegExp(`^${inputUsername}_\\d+$`);
  
  const matchingUsers = allUsers.filter(u => pattern.test(u.username));
  
  if (matchingUsers.length === 1) {
    // 정확히 하나의 매칭이 발견되면 반환
    return matchingUsers[0];
  } else if (matchingUsers.length > 1) {
    // 여러 매칭이 있으면 가장 최근 것 반환 (높은 ID)
    return matchingUsers.sort((a, b) => b.id - a.id)[0];
  }

  // 매칭 없음
  return null;
}