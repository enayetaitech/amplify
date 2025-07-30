import config from "../config/index";
import { ProjectCreateAndPaymentConfirmationEmailTemplateParams, TemplateParams } from "../../shared/interface/ProjectInfoEmailInterface"
import { ModeratorAddedEmailParams} from "../../shared/interface/ModeratorAddedEmailInterface"

export const verificationEmailTemplate = (name: string, verificationLink : string): string => `
  <p>Dear ${name},</p>
  <p>Thank you for signing up to host your project on the Amplify Research Virtual Backroom platform. Please click the link below to verify your account information:</p>
   <p style="text-align: center; margin: 24px 0;">
      <a
        href="${verificationLink }"
        style="
          background-color:  #FC6E15;
          color: #ffffff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
          font-weight: bold;
        "
      >
        Verify Your Account
      </a>
    </p>
  <p>You will not be able to set up project details or conduct any sessions until this step is complete, so we encourage you to do this immediately upon receipt of this email.</p>
  <p>Thank you!</p>
  <p>The Amplify Team</p>
`;


export const resetPasswordEmailTemplate = (name: string, token: string): string => `
  <p>Hi ${name},</p>
  <p>Please copy the link below to reset your password:</p>
  <p>
    <a href="${process.env.FRONTEND_BASE_URL}/reset-password?token=${token}">
      Reset Your Password
    </a>
  </p>
  <p>If you did not request a password reset, please ignore this email.</p>
  <p>Thank you!</p>
  <p>The Amplify Team</p>
`;

export const projectInfoEmailTemplate = ({
  user,
  formData,
  formattedSessions,
}: TemplateParams): string => `
  <h2>Project Information</h2>
  <p><strong>First Name:</strong> ${user.firstName}</p>
  <p><strong>Last Name:</strong> ${user.lastName}</p>
  <p><strong>Email:</strong> ${user.email}</p>
  <h3>Form Data:</h3>
  <p><strong>Service:</strong> ${formData.service}</p>
  <p><strong>Add-Ons:</strong> ${formData.addOns?.join(", ")}</p>
  <p><strong>Market:</strong> ${formData.respondentCountry}</p>
  <p><strong>Language:</strong> ${formData.respondentLanguage}</p>
  <h4>Sessions:</h4>
  ${formattedSessions}
  <p><strong>First Date of Streaming:</strong> ${formData.firstDateOfStreaming}</p>
  <p><strong>Respondents per Session:</strong> ${formData.respondentsPerSession}</p>
  <p><strong>Number of Sessions:</strong> ${formData.numberOfSessions}</p>
  <p><strong>Session Length:</strong> ${formData.sessionLength}</p>
  <p><strong>Pre-Work Details:</strong> ${formData.preWorkDetails}</p>
  <p><strong>Selected Language:</strong> ${formData.selectedLanguage}</p>
  <p><strong>Additional Info:</strong> ${formData.additionalInfo}</p>
  <p class="mt-4">The Amplify Team</p>
`;

export const projectCreateAndPaymentConfirmationEmailTemplate = ({
  firstName,
  purchaseAmount,
  creditsPurchased,
  transactionDate,
  newCreditBalance,
}: ProjectCreateAndPaymentConfirmationEmailTemplateParams): string => `
  <p>Dear ${firstName || "Customer"},</p>
  <p>
    Thank you for purchasing credit for Amplify’s Virtual Backroom. Your transaction has been successfully processed,
    and the credits have been added to your account.
  </p>
  <p><strong>Transaction Details:</strong></p>
  <ul>
    <li>Purchase Amount: $${purchaseAmount}</li>
    <li>Number of Credits: ${creditsPurchased}</li>
    <li>Transaction Date: ${transactionDate}</li>
    <li>New Credit Balance: ${newCreditBalance}</li>
  </ul>
  <p>
    You can now access and use your credits for our Virtual Backroom services at any time. If you have any questions or need assistance,
    please don’t hesitate to reach out to our support team at support@amplifyresearch.com.
  </p>
  <p>Cheers!</p>
  <p>The Amplify Team</p>
`;

export const moderatorAddedEmailTemplate = ({
  moderatorName,
  addedByName,
  projectName,
  loginUrl,
}: ModeratorAddedEmailParams): string => `
  <p>Hi ${moderatorName},</p>

  <p>${addedByName} has just added you as a moderator on the project <strong>"${projectName}"</strong> in the Amplify platform.</p>

  <p>You can log in to your account here to view and manage your moderator permissions:</p>
  <p><a href="${loginUrl}">Go to Amplify Dashboard</a></p>

  <p>If you have any questions, feel free to reach out to support@amplifyresearch.com.</p>

  <p>Cheers,<br/>The Amplify Team</p>
`;


