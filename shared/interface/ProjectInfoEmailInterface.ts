export interface TemplateParams {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  formData: any;
  formattedSessions: string;
}


export interface ProjectCreateAndPaymentConfirmationEmailTemplateParams {
  firstName: string;
  purchaseAmount: number;
  creditsPurchased: number;
  transactionDate: string;
  newCreditBalance: number;
}