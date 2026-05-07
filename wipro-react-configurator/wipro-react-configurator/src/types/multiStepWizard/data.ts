export type StatusData = 'CONTRACTOR' | 'OWNER' | 'ARCHITECT' | 'COST_ESTIMATOR'

export interface FormData {
  name: string;
  phoneNumber: string;
  email: string;
  street: string;
  houseNo: string;
  localNo?: string;
  postalCode: string;
  city: string;
  status: StatusData;
  investor: string;
}