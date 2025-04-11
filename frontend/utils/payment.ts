// /utils/payment.ts
import axios from "axios";
import { IUser } from "@shared/interface/user.interface";

// Retrieves the token from localStorage
export const getToken = (): string => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      return userObj.token || "";
    } catch (error) {
      return "";
    }
  }
  return "";
};

// Retrieves the user object from localStorage
export const getUser = (): IUser | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
};

// Charges the customer using the saved card for a given amount (in cents)
export const chargeWithSavedCard = async (amountCents: number, totalCreditsNeeded: number): Promise<any> => {
  const token = getToken();
  const user = getUser();

  if (!user || !user.stripeCustomerId) {
    throw new Error("No Stripe customer ID available");
  }

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/charge`,
    { customerId: user.stripeCustomerId, amount: amountCents, currency: "usd", userId: user._id, purchasedCredit:totalCreditsNeeded },
    { headers: { Authorization: `Bearer ${token}` } }
  );
localStorage.setItem("user", JSON.stringify(response.data.data.user));
  console.log("charge payment response", response);
  return response.data;
};
