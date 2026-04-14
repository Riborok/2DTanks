export interface WsAuthUser {
    userId: string;
    login: string;
    displayName: string;
}

export interface UserRow {
    user_id: string;
    login: string;
    email: string;
    password_hash: string;
    display_name: string;
    created_at: Date;
    updated_at: Date;
}

export interface UserProfileRow {
    profile_id: string;
    user_id: string;
    avatar_url: string | null;
    preferred_role: 'attacker' | 'defender' | null;
    created_at: Date;
    updated_at: Date;
}
