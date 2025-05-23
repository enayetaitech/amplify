import transporter from "../../config/NodemailerConfig";
import config from "../../config/index"
import {SendEmailOptions} from "../../../shared/interface/SendEmailInterface"


export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const mailOptions = {
    from: config.EMAIL_FROM || 'test356sales@gmail.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email has been sent:", info);
    }
  });
  
};
