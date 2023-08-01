type Env = {
  ANAL: AnalyticsEngineDataset
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const cf = request.cf as Record<string, any>
  const qs = new URL(request.url).search
  console.log({ qs })
  env.ANAL?.writeDataPoint({
    blobs: [cf.colo, cf.country, cf.city, cf.region, cf.timezone, qs],
    doubles: [cf.metroCode, cf.longitude, cf.latitude],
    indexes: [cf.postalCode],
  })

  return new Response("k")
}
