import { ProjectCreateAndPaymentConfirmationEmailTemplateParams, TemplateParams } from "../../shared/interface/ProjectInfoEmailInterface";
import { ModeratorAddedEmailParams } from "../../shared/interface/ModeratorAddedEmailInterface";
export declare const verificationEmailTemplate: (name: string, token: string) => string;
export declare const resetPasswordEmailTemplate: (name: string, token: string) => string;
export declare const projectInfoEmailTemplate: ({ user, formData, formattedSessions, }: TemplateParams) => string;
export declare const projectCreateAndPaymentConfirmationEmailTemplate: ({ firstName, purchaseAmount, creditsPurchased, transactionDate, newCreditBalance, }: ProjectCreateAndPaymentConfirmationEmailTemplateParams) => string;
export declare const moderatorAddedEmailTemplate: ({ moderatorName, addedByName, projectName, loginUrl, }: ModeratorAddedEmailParams) => string;
//# sourceMappingURL=emailTemplates.d.ts.map