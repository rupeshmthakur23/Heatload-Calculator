const CLIMATE_ROUTE = "/climate/design-temp"; // change to "/climate/design-temp" if your server isn't under /api

import httpClient from "shared/utils/httpClient";

export async function fetchDesignOutdoorTemp(address: string) {
  const { data } = await httpClient.get(CLIMATE_ROUTE, { params: { address } });
  return {
    designTempC: data.designTempC as number,
    meta: {
      method: data.method as string | undefined,
      provider: data.provider as string | undefined,
      geocode: data.geocode as any,
      computedAt: data.computedAt as string | undefined,
    },
  };
}
