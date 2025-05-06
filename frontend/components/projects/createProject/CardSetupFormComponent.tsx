// /components/CardSetupForm.tsx
"use client";
import React from "react";
import { toast } from "sonner";
import { Button } from "components/ui/button";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CardSetupFormProps } from "@shared/interface/CreateProjectInterface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { IUser } from "@shared/interface/UserInterface";



export const CardSetupForm: React.FC<CardSetupFormProps> = ({
  onCardSaved,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user, setUser } = useGlobalContext();
  // const [clientSecret, setClientSecret] = useState("");
  // const [loading, setLoading] = useState(false);
  // const token = getToken();
  const qc = useQueryClient();

  // useEffect(() => {
  //   let mounted = true;
  //   const createSetupIntent = async () => {
  //     try {
  //       if (!mounted) return;
  //       const user = getUser();
  //       if (!user) return toast.error("User not found");

  //       const response = await axios.post(
  //         `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/create-setup-intent`,
  //         { userId: user._id },
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );

  //       console.log("Received client secret", response.data.data.clientSecret);
  //       setClientSecret(response.data.data.clientSecret);
  //     } catch (err) {
  //       console.log(err)
  //       toast.error("Error creating setup intent");
  //     }
  //   };
  //   createSetupIntent();
  //   return () => {
  //     mounted = false;
  //   };
  // }, [token]);


    // 1️⃣ Fetch Setup Intent
    const { data: clientSecret, isLoading: loadingSecret } = useQuery<
    string,
    ErrorResponse
  >({
    queryKey: ["stripeSetupIntent", user?._id],
    queryFn: async () => {
      if (!user || !user._id) throw new Error("Not authenticated");
      const res = await api.post<ApiResponse<{ clientSecret: string }>>(
        "/api/v1/payment/create-setup-intent",
        { userId: user._id }
      );
      return res.data.data.clientSecret;
    },
    enabled: Boolean(user?._id),
  });

  // 2️⃣ Save the payment method to your backend
  const saveCardMutation = useMutation<
    IUser,
    ErrorResponse,
    string
  >({
    mutationFn: async (paymentMethodId) => {
      if (!user) throw new Error("Not authenticated");
      const res = await api.post<ApiResponse<{ user: IUser }>>(
        "/api/v1/payment/save-payment-method",
        {
          customerId: user.stripeCustomerId!,
          paymentMethodId,
        }
      );
      return res.data.data.user;
    },
    onSuccess: (newUser) => {
      // update global user and invalidate the intent so we don't reuse it
      setUser(newUser);
      qc.invalidateQueries({ queryKey: ["stripeSetupIntent", user!._id] });

      toast.success("Card saved successfully");
      onCardSaved();
    },
    onError: (err) => {
      toast.error(err.message || "Error saving card");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return;

    // Confirm setup intent with Stripe.js
    const { error, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      { payment_method: { card: cardEl } }
    );
    if (error) {
      toast.error(error.message || "Error during card setup");
      return;
    }

    // Extract the payment method ID
    const pmField = setupIntent.payment_method;
    const pmId =
      typeof pmField === "string" ? pmField : pmField?.id;
    if (!pmId) {
      toast.error("Unable to retrieve payment method ID");
      return;
    }

    // Kick off the backend mutation
    saveCardMutation.mutate(pmId);
  };

  if (loadingSecret) {
    return <p>Loading payment form…</p>;
  }

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!stripe || !elements || !clientSecret) return;

  //   setLoading(true);
  //   const cardElement = elements.getElement(CardElement);

  //   const result = await stripe.confirmCardSetup(clientSecret, {
  //     payment_method: { card: cardElement! },
  //   });

  //   if (result.error) {
  //     toast.error(result.error.message || "Error saving card");
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     if (result.setupIntent.payment_method) {
  //       const user = getUser();
  //       if (!user || !user.stripeCustomerId) {
  //         toast.error("User or Stripe customer not found");
  //         setLoading(false);
  //         return;
  //       }

  //       const result2 = await axios.post(
  //         `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/save-payment-method`,
  //         {
  //           customerId: user.stripeCustomerId,
  //           paymentMethodId: result.setupIntent.payment_method,
  //         },
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       // Optionally update localStorage with the returned user data.
  //       if (result2.data.data?.user) {
  //         localStorage.setItem("user", JSON.stringify(result2.data.data.user));
  //       }
  //       toast.success("Card saved successfully");
  //       onCardSaved();
  //     }
  //   } catch (err: unknown) {
  //     if (axios.isAxiosError(err)) {
  //       toast.error(err.response?.data?.error || "Error retrieving card info");
  //     } else {
  //       toast.error("Error retrieving card info");
  //     }
  //   }
  //   setLoading(false);
  // };

  return (
    <form
    onSubmit={handleSubmit}
    className="space-y-4 border p-4 rounded-md"
  >
    <h2 className="text-lg font-semibold">Enter Card Details</h2>

    <div className="border p-4 rounded-md">
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#32325d",
              "::placeholder": { color: "#aab7c4" },
            },
          },
        }}
      />
    </div>

    <Button
      type="submit"
      disabled={!stripe || saveCardMutation.isPending}
    >
      {saveCardMutation.isPending
        ? "Saving Card..."
        : "Save Card & Pay"}
    </Button>
  </form>
    // <form
    //   onSubmit={handleSubmit}
    //   className="space-y-4 border p-4 rounded-md"
    // >
    //   <h2 className="text-lg font-semibold">Enter Card Details</h2>
    //   <div className="border p-4 rounded-md">
    //     <CardElement
    //       options={{
    //         style: {
    //           base: {
    //             fontSize: "16px",
    //             color: "#32325d",
    //             "::placeholder": { color: "#aab7c4" },
    //           },
    //         },
    //       }}
    //     />
    //   </div>
    //   <Button type="submit" disabled={loading || !stripe}>
    //     {loading ? "Saving Card..." : "Save Card & Pay"}
    //   </Button>
    // </form>
  );
};

export default CardSetupForm;
