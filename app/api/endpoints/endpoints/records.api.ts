import { RecordFilters, RecordRead, RecordUpdate } from "@/types"
import apiClient from "../client/apiClient"

export const recordsApi = {
    // Get Record List
    getRecords: async (filters?: RecordFilters): Promise<RecordRead[]> => {
        const response = await apiClient.get('/records', {
            params: filters
        })
        return response.data
    },
    
    // Get Record by ID
    getRecordById: async (recordId: number): Promise<RecordRead> => {
        const response = await apiClient.get(`/records/${recordId}`)
        return response.data
    },
    
    // Store a new Record
    createRecord: async (data: RecordUpdate): Promise<RecordRead> => {
        const response = await apiClient.post('/records', data)
        return response.data
    },
    
}