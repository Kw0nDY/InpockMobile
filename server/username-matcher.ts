import type { DatabaseStorage } from "./storage";

export async function findUserByFlexibleUsername(
  storage: DatabaseStorage, 
  inputUsername: string
): Promise<any> {
  // First try exact match
  let user = await storage.getUserByUsername(inputUsername);
  if (user) {
    return user;
  }

  // If no exact match, try to find users with auto-generated usernames
  // that start with the input username followed by underscore and numbers
  const allUsers = await storage.getAllUsers();
  
  // Look for pattern: inputUsername_[numbers]
  const pattern = new RegExp(`^${inputUsername}_\\d+$`);
  
  const matchingUsers = allUsers.filter(u => pattern.test(u.username));
  
  if (matchingUsers.length === 1) {
    // If exactly one match found, return it
    return matchingUsers[0];
  } else if (matchingUsers.length > 1) {
    // If multiple matches, return the most recent one (highest ID)
    return matchingUsers.sort((a, b) => b.id - a.id)[0];
  }

  // No match found
  return null;
}