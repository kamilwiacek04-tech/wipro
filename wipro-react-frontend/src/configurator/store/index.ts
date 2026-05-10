import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { formSlice } from "@/store/slices/formSlice";
import mainApi from "@/store/mainApi"
import { setupListeners } from "@reduxjs/toolkit/query";
import { modalSlice } from "./slices/modalSlice";

export const store = configureStore({
    reducer: {
        [mainApi.reducerPath]: mainApi.reducer,
        form: formSlice.reducer,
        modal: modalSlice.reducer
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({})
    .concat(mainApi.middleware)
})

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
