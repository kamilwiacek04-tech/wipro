import { createApi } from '@reduxjs/toolkit/query/react'
import { mainApiAxiosInstanceBaseQuery } from '@/store/mainApi/axioInstance'


const mainApi = createApi({
    reducerPath: 'mainApi',
    baseQuery: mainApiAxiosInstanceBaseQuery({
        baseUrl: import.meta.env.VITE_PUBLIC_API_URL ?? '',
    }),
    endpoints: () => ({})
})

export default mainApi;