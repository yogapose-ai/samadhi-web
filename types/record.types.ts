import { UserReadSimple } from "./user.types"

interface RecordBase{
    datetime: string
    workingout_time: number
    youtube_url: string
	totalscore: number
    timelines: TimelineBase[]
}

interface TimelineBase{
    youtube_start_sec: number
    youtube_end_sec: number
    pose: string
    score: number
}

export interface RecordRead extends RecordBase {
    userInfo: UserReadSimple
}

export interface RecordCreate extends RecordBase {}

export interface RecordUpdate extends RecordBase {
    recordId: number
}