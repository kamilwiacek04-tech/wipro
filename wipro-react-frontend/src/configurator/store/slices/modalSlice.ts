import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ModalType = 'success' | 'error';

interface ModalState {
    visible?: boolean;
    type: ModalType;
}

const initialState: ModalState = {
    visible: false,
    type: 'success'
}

export const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModal: (state: ModalState, action: PayloadAction<ModalState>) => {
            state.type = action.payload.type;
            state.visible = true;
        },
        closeModal: (state: ModalState) => {
            state.visible = false;
        }
    }
})

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;