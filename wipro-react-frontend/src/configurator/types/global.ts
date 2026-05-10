import { FormData } from "@/types/multiStepWizard/data";
import { FormShaftParameters, FormShaftTempParameters } from "@/types/multiStepWizard/shaftParameters";
import { FormFinishesAndAccessories } from "@/types/multiStepWizard/finishesAndAccessories";

export interface FormType {
    data: FormData,
    shaftTempParameters: FormShaftTempParameters;
    shaftParameters: FormShaftParameters;
    finishesAndAccessories: FormFinishesAndAccessories;
}

export type FillFieldPayload<K extends keyof FormType> = {
  key: K;
  value: FormType[K];
};