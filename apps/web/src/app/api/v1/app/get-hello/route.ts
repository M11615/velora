import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl: URL = new URL("v1/app/get-hello", process.env.SERVER_URL);
  const requestHeader: Headers = request.headers;
  const response: Response = await fetch(requestUrl.toString(), {
    method: "GET",
    headers: requestHeader
  });
  const responseBody: BodyInit = await response.text();
  return new NextResponse(responseBody, {
    status: response.status,
    headers: response.headers
  });
};
