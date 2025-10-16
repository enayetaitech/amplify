"use client";
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { CreditCard, Receipt, History, Plus, Settings } from "lucide-react";
import { useGlobalContext } from "context/GlobalContext";
import BillingForm from "components/projects/createProject/BillingFormComponent";
import CardSetupForm from "components/projects/createProject/CardSetupFormComponent";
import { useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IUser } from "@shared/interface/UserInterface";
import { useBuyCredits } from "hooks/billing/useBuyCredits";
import { useUsage, UsageItem } from "hooks/billing/useUsage";
import { usePurchases, PurchaseItem } from "hooks/billing/usePurchases";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import axios from "axios";

function OverviewTab() {
  const { user } = useGlobalContext();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ user: IUser }>>(
        "/api/v1/users/me"
      );
      return res.data.data.user;
    },
  });
  const u = me || user;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{u?.credits ?? 0}</div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Default Card</CardTitle>
          <CreditCard className="h-5 w-5" />
        </CardHeader>
        <CardContent>
          {u?.creditCardInfo?.last4 ? (
            <div>
              <div className="font-medium">
                {u?.creditCardInfo?.brand} •••• {u?.creditCardInfo?.last4}
              </div>
              <div className="text-sm text-muted-foreground">
                Exp {u?.creditCardInfo?.expiryMonth}/
                {u?.creditCardInfo?.expiryYear}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No card on file</div>
          )}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Billing Address</CardTitle>
          <Settings className="h-5 w-5" />
        </CardHeader>
        <CardContent>
          {u?.billingInfo ? (
            <div className="text-sm">
              <div>{u.billingInfo.address}</div>
              <div>
                {u.billingInfo.city}, {u.billingInfo.state}{" "}
                {u.billingInfo.postalCode}
              </div>
              <div>{u.billingInfo.country}</div>
            </div>
          ) : (
            <div className="text-muted-foreground">No billing address</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type PaymentMethodItem = {
  id: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  isDefault: boolean;
};

function PaymentMethodsTab() {
  const { data, refetch } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () =>
      (
        await api.get<ApiResponse<{ items: PaymentMethodItem[] }>>(
          "/api/v1/payment/methods"
        )
      ).data.data.items,
  });
  const items: PaymentMethodItem[] = data || [];
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((pm) => (
          <Card key={pm.id} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {pm.brand?.toUpperCase() || "Card"} •••• {pm.last4}
              </CardTitle>
              {pm.isDefault && (
                <span className="text-xs rounded px-2 py-1 bg-emerald-50 text-emerald-700">
                  Default
                </span>
              )}
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await api.post("/api/v1/payment/set-default", {
                    paymentMethodId: pm.id,
                  });
                  refetch();
                }}
              >
                Set default
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  try {
                    await api.post("/api/v1/payment/detach", {
                      paymentMethodId: pm.id,
                    });
                    refetch();
                    toast.success("Card removed");
                  } catch (err: unknown) {
                    const message = axios.isAxiosError(err)
                      ? (err.response?.data as { message?: string })?.message ??
                        err.message
                      : err instanceof Error
                      ? err.message
                      : "Unknown error";
                    toast.error(message);
                  }
                }}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Elements stripe={stripePromise}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Add a new card</CardTitle>
            <Plus className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <CardSetupForm onCardSaved={() => refetch()} />
          </CardContent>
        </Card>
      </Elements>
    </div>
  );
}

function BillingDetailsTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;
  return (
    <div className="space-y-4">
      <BillingForm onSuccess={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}

function BuyCreditsTab() {
  const [credits, setCredits] = React.useState<number>(100);
  const pricePerCreditCents = 150; // $1.5 per credit
  const amountCents = credits * pricePerCreditCents;
  const { mutate: buy, isPending } = useBuyCredits(() => {});
  return (
    <Card className="border-0 shadow-sm max-w-md">
      <CardHeader>
        <CardTitle>Buy Credits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            className="border rounded px-2 py-1 w-28"
            value={credits}
            onChange={(e) =>
              setCredits(Math.max(1, Number(e.target.value || 1)))
            }
          />
          <div className="text-sm text-muted-foreground">credits</div>
        </div>
        <div className="text-sm">
          Amount: ${(amountCents / 100).toFixed(2)} USD
        </div>
        <Button
          className="bg-custom-teal hover:bg-custom-dark-blue-3"
          disabled={isPending}
          onClick={() => {
            const idempotencyKey = crypto.randomUUID();
            buy({ amountCents, credits, idempotencyKey });
          }}
        >
          {isPending ? "Processing..." : "Buy Now"}
        </Button>
      </CardContent>
    </Card>
  );
}

function UsageTab() {
  const { data } = useUsage("month", 5);
  const items: UsageItem[] = data?.items || [];
  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Usage</CardTitle>
          <History className="h-5 w-5" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((it: UsageItem, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="truncate max-w-[60%]">
                  {it.projectName || "Project"} • {it.sessionTitle || "Session"}
                </div>
                <div>{it.creditsUsed ?? 0} cr</div>
              </div>
            ))}
            {!items.length && (
              <div className="text-muted-foreground text-sm">
                No recent usage
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoicesTab() {
  const { data } = usePurchases(20);
  const items: PurchaseItem[] = data?.items || [];
  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Purchases</CardTitle>
          <Receipt className="h-5 w-5" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((p: PurchaseItem) => (
              <div
                key={p._id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">
                    {(p.amountCents / 100).toFixed(2)}{" "}
                    {p.currency?.toUpperCase()} • {p.credits} credits
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()} • {p.status}
                  </div>
                </div>
                {p.receiptUrl ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={p.receiptUrl} target="_blank" rel="noreferrer">
                      Receipt
                    </a>
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    No receipt
                  </span>
                )}
              </div>
            ))}
            {!items.length && (
              <div className="text-muted-foreground text-sm">
                No purchases yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="details">Billing Details</TabsTrigger>
          <TabsTrigger value="buy">Buy Credits</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="methods">
          <PaymentMethodsTab />
        </TabsContent>
        <TabsContent value="details">
          <BillingDetailsTab />
        </TabsContent>
        <TabsContent value="buy">
          <BuyCreditsTab />
        </TabsContent>
        <TabsContent value="usage">
          <UsageTab />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
