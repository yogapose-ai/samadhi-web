import { apiClient } from '../client/apiClient'
import {
  UserRead,
  UserUpdate,
} from '@/types'

export const usersApi = {
  // Get current user
  getMe: async (): Promise<UserRead> => {
    const response = await apiClient.get('/users/me')
    return response.data
  },

  // Update current user
  updateMe: async (data: UserUpdate): Promise<UserRead> => {
    const response = await apiClient.put('/users/me', data)
    return response.data
  },
  
    // Upload profile image
    uploadProfileImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post('/users/me/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
