export interface ApiResponse<DATA = object | []> {
    status: number;
    data: DATA;
    info?: string;
    error?: string;
}