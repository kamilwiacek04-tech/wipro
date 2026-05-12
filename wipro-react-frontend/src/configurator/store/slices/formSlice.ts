import { FillFieldPayload, FormType } from "@/types/global";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { blankFormState, useFormStore } from "@/store/zustand/formStore";
import { RootState } from "..";

const initialState: FormType = {
    data: {
        ...useFormStore.getState().store.data
    },
    shaftTempParameters: {
        ...useFormStore.getState().store.shaftTempParameters
    },
    shaftParameters: {
        ...useFormStore.getState().store.shaftParameters
    },
    finishesAndAccessories: {
        ...useFormStore.getState().store.finishesAndAccessories
    }
}

export const formSlice = createSlice({
    name: 'form',
    initialState,
    reducers: {
        fillField: <K extends keyof FormType>(state: FormType, action: PayloadAction<FillFieldPayload<K>>) => {
            state[action.payload.key] = action.payload.value;
        },
        resetState: () => ({ ...blankFormState })
    }
})

export const formSelectors = {
    data: (state: RootState) => state.form.data,
    shaftParameters: (state: RootState) => state.form.shaftParameters,
    finishesAndAccessories: (state: RootState) => state.form.finishesAndAccessories
}

export const { fillField, resetState } = formSlice.actions;
export default formSlice.reducer;