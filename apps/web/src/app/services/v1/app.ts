import { headerName } from "@/app/i18n/settings";
import { i18n } from "i18next";

export const getHello = async (i18n: i18n): Promise<Response> => {
  const requestHeader: Headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    [headerName]: i18n.language
  });
  const response: Response = await fetch("api/v1/app/get-hello", {
    method: "GET",
    headers: requestHeader
  });
  if (!response.ok) throw new Error();
  return response;
};
