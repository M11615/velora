import { NextRequest, NextResponse } from "next/server";

export interface SubscriptionRequest {
  email: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestUrl: URL = new URL("v1/subscription/create-subscription", process.env.SERVER_URL);
  const requestHeader: Headers = request.headers;
  const requestBody: SubscriptionRequest = await request.json();
  const response: Response = await fetch(requestUrl.toString(), {
    method: "POST",
    headers: requestHeader,
    body: JSON.stringify(requestBody)
  });
  const responseBody: BodyInit = await response.json();
  return new NextResponse(JSON.stringify(responseBody), {
    status: response.status,
    headers: response.headers
  });
};
