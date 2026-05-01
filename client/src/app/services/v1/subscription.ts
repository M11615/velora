import { SubscriptionRequest } from "@/app/api/v1/subscription/create-subscription/route";

export const createSubscription = async (requestBody: SubscriptionRequest): Promise<Response> => {
  const requestHeader: Headers = new Headers({
    "Content-Type": "application/json; charset=utf-8"
  });
  const response: Response = await fetch("api/v1/subscription/create-subscription", {
    method: "POST",
    headers: requestHeader,
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) throw new Error();
  return response;
};
