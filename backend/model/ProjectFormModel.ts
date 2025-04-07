import { Schema, model, Document, Types } from "mongoose";
import { IProjectForm } from "../../shared/interface/projectForm.interface";

export interface IProjectFormDocument extends Omit<IProjectForm, "user">, Document {
  user: Types.ObjectId;
}

const projectFormSchema = new Schema<IProjectFormDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    service: {
      type: String,
      enum: ["Concierge", "Signature"],
      required: true,
    },
    addOns: { type: [String] },
    respondentCountry: { type: String },
    respondentLanguage: { type: String },
    sessions: [
      {
        number: { type: Number },
        duration: { type: String },
      },
    ],
    firstDateOfStreaming: { type: Date, required: true },
    respondentsPerSession: { type: Number, default: 0 },
    numberOfSessions: { type: Number, default: 0 },
    sessionLength: { type: String, default: " " },
    recruitmentSpecs: { type: String, default: " "},
    preWorkDetails: { type: String, default: " " },
    selectedLanguage: { type: String, default: " "},
    inLanguageHosting: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },
    provideInterpreter: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },
    languageSessionBreakdown: { type: String, default: "" },
    additionalInfo: { type: String, default: "" },
    emailSent: { type: String, default: "Pending" },
  },
  {
    timestamps: true,
  }
);

export default model<IProjectFormDocument>("ProjectForm", projectFormSchema);
