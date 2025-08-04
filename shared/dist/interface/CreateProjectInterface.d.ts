import { IProjectForm } from "./ProjectFormInterface";
export type IProjectFormState = Omit<IProjectForm, "firstDateOfStreaming" | "projectDate"> & {
    firstDateOfStreaming: string;
    projectDate: string;
};
export interface StepProps {
    formData: IProjectFormState;
    updateFormData: (fields: Partial<IProjectFormState>) => void;
    uniqueId: string | null;
}
export interface Step1Props {
    formData: Omit<IProjectFormState, "firstDateOfStreaming" | "projectDate"> & {
        firstDateOfStreaming: string;
        projectDate: string;
    };
    updateFormData: (fields: Partial<Omit<IProjectFormState, "firstDateOfStreaming" | "projectDate"> & {
        firstDateOfStreaming: string;
        projectDate: string;
    }>) => void;
}
export interface Step2Props {
    formData: IProjectFormState;
    updateFormData: (fields: Partial<IProjectFormState>) => void;
    uniqueId: string | null;
}
export type Step2FormValues = {
    respondentsPerSession: number;
    numberOfSessions: number;
    sessionLength: number;
    preWorkDetails: string;
    selectedLanguage: string;
    languageSessionBreakdown: string;
    additionalInfo: string;
    inLanguageHosting?: "yes" | "no";
    recruitmentSpecs?: string;
    provideInterpreter?: "yes" | "no" | "";
};
export interface Step3Props {
    formData: IProjectFormState;
    updateFormData: (fields: Partial<IProjectFormState>) => void;
    uniqueId: string | null;
}
export interface Step4Props {
    formData: {
        name: string;
        service: string;
        respondentCountry: string;
        respondentLanguage: string | string[];
        sessions: Array<{
            number: number;
            duration: string;
        }>;
        description?: string;
        firstDateOfStreaming: string;
    };
    updateFormData: (fields: Partial<IProjectFormState>) => void;
    uniqueId: string | null;
}
export interface PaymentIntegrationProps {
    totalPurchasePrice: number;
    totalCreditsNeeded: number;
    projectData: IProjectFormState;
    uniqueId: string | null;
}
export interface BillingFormProps {
    onSuccess: () => void;
}
export interface CardSetupFormProps {
    onCardSaved: () => void;
}
//# sourceMappingURL=CreateProjectInterface.d.ts.map