export interface UserResponse {
    user: User,
    tokens: UserToken
}

export interface User {
    id: number,
    clientId: number,
    role: number,
    firstName: string,
    lastName: string,
    contact: string,
    email: string,
    designation: string,
    projectAccess: string,
    profilePhoto: string
}

export interface UserToken {
    access: {
        token: string,
        expires: string
    },
    refresh: {
        token: string,
        expires: string
    }
}