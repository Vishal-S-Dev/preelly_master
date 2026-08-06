/** Item shape returned by GET /api/user/blocked. */
export interface BlockedUserDTO {
  _id: string;
  name?: string;
  displayName?: string;
  avatar?: string | null;
  email?: string;
  phone?: string;
  isVerified?: boolean;
  blockedAt?: string | null;
}

export interface BlockedUsersResponseDTO {
  blockedUsers: BlockedUserDTO[];
  items: BlockedUserDTO[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/** Item shape returned by GET /api/user/search. */
export interface UserSearchResultDTO {
  _id: string;
  name?: string;
  displayName?: string;
  avatar?: string | null;
  isVerified?: boolean;
  role?: string;
}

export interface UserSearchResponseDTO {
  users: UserSearchResultDTO[];
}

export interface BlockedUserListing {
  id: string;
  name: string;
  avatarUri: string | null;
  usernameLabel: string | null;
  blockedOnLabel: string | null;
}

export interface BlockSearchResultListing {
  id: string;
  name: string;
  avatarUri: string | null;
  roleLabel: string;
}
