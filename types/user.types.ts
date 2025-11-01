export interface UserRead {
    id: number
    email: string
    nickname: string
    age: number
    gender: number
    height: number
    weight: number
    profile_image_url?: string
}

export interface UserReadSimple{
    nickname: string
    age: number
    gender: number
    height: number
    weight: number
    profile_image_url?: string
}

export interface UserUpdate {
    nickname: string
    age: number
    gender: number
    height: number
    weight: number
    profile_image_url?: string
}