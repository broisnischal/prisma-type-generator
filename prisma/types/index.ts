export interface User {
  id: string;
  name: string;
  username: string;
}

export interface Profile {
  id: string;
  contact: number;
  userId: string;
}

export const UserType = { pro: "pro", best: "best" } as const;
export type UserType = (typeof UserType)[keyof typeof UserType];
