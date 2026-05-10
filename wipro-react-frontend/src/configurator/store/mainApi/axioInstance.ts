import { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';


export const mainApiAxiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

export const mainApiAxiosInstanceBaseQuery = 
(
    {baseUrl}: {baseUrl: string} = {baseUrl: ''},
): BaseQueryFn<{
    url?: string;
    fullUrl?: string;
    method?: AxiosRequestConfig['method'];
    params?: AxiosRequestConfig['params'];
    body?: unknown;
    headers?: AxiosRequestConfig['headers'];
},
unknown,
unknown
> => async ({ url, fullUrl, method, body, params, headers}) => {
    try {
        const result = await mainApiAxiosInstance({
            url: fullUrl ?? baseUrl + url,
            method: method ?? 'POST',
            data: body,
            params,
            headers
        });

        return {
            data: result.data
        };
    } catch (axiosError) {
        console.log(axiosError)
        const err = axiosError as AxiosError;
        return {
            error: {
                status: err.response?.status,
                data: err.response?.data || err.message
            }
        }
    }
}