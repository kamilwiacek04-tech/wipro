import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CabinModel } from "@/store/mainApi/response";

export type ModalType = 'success' | 'error' | 'cabinInfo';

interface ModalState {
    visible?: boolean;
    type: ModalType;
    cabinModel?: CabinModel;
}

const initialState: ModalState = {
    visible: false,
    type: 'success'
}

export const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModal: (state: ModalState, action: PayloadAction<Omit<ModalState, 'visible'>>) => {
            state.type = action.payload.type;
            state.cabinModel = action.payload.cabinModel;
            state.visible = true;
        },
        closeModal: (state: ModalState) => {
            state.visible = false;
            state.cabinModel = undefined;
        }
    }
})

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;