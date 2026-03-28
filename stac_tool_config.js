export const WORKER_ROUTING = {
  enabled: true,
  proxyBase: "https://agis.sweetxander.workers.dev/?url=",
  proxyApiHosts: [
    "earth-search.aws.element84.com",
    "planetarycomputer.microsoft.com",
    "stac.overturemaps.org",
  ],
  proxyAssetHosts: [
    "copernicus-dem-30m.s3.amazonaws.com",
    "copernicus-dem-90m.s3.amazonaws.com",
    "sentinel-cogs.s3.us-west-2.amazonaws.com",
    "naipeuwest.blob.core.windows.net",
    "overturemaps-us-west-2.s3.us-west-2.amazonaws.com",
    "overturemapswestus2.blob.core.windows.net",
    "ai4edataeuwest.blob.core.windows.net",
    "ai4edatasetspublicassets.blob.core.windows.net",
    "elevationeuwest.blob.core.windows.net",
    "pcstacitems.blob.core.windows.net",
    "usgslidareuwest.blob.core.windows.net",
  ],
};

function mergeProxyHosts(...hostLists) {
  return [...new Set(hostLists.flat().filter(Boolean))];
}

export function withWorkerRouting(source, overrides = {}) {
  return {
    ...source,
    ...overrides,
    proxyBase: WORKER_ROUTING.proxyBase,
    apiProxyBase: WORKER_ROUTING.proxyBase,
    assetProxyBase: WORKER_ROUTING.proxyBase,
    proxyApiHosts: mergeProxyHosts(
      WORKER_ROUTING.proxyApiHosts || [],
      source.proxyApiHosts || [],
      overrides.proxyApiHosts || [],
    ),
    proxyAssetHosts: mergeProxyHosts(
      WORKER_ROUTING.proxyAssetHosts || [],
      source.proxyAssetHosts || [],
      overrides.proxyAssetHosts || [],
    ),
  };
}

function routeViaWorkerUrl(url, options = {}) {
  const { kind = "asset", extraHosts = [] } = options;

  if (!WORKER_ROUTING.enabled || !WORKER_ROUTING.proxyBase || !url) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const allowedHosts = mergeProxyHosts(
      kind === "api" ? WORKER_ROUTING.proxyApiHosts || [] : WORKER_ROUTING.proxyAssetHosts || [],
      extraHosts,
    );

    if (allowedHosts.includes(parsed.hostname)) {
      return `${WORKER_ROUTING.proxyBase}${encodeURIComponent(url)}`;
    }
  } catch {
    return url;
  }

  return url;
}

export function routeApiUrl(url, extraHosts = []) {
  return routeViaWorkerUrl(url, { kind: "api", extraHosts });
}

export function routeAssetUrl(url, extraHosts = []) {
  return routeViaWorkerUrl(url, { kind: "asset", extraHosts });
}

export const SOURCE_DIRECTORY_SEED = [
  withWorkerRouting({
    id: "earth-search",
    label: "Earth Search",
    section: "curated",
    sourceType: "stac-api",
    adapterType: "stac-api",
    enabled: true,
    endpointOrUrl: "https://earth-search.aws.element84.com/v1",
    endpoint: "https://earth-search.aws.element84.com/v1",
    browserRenderable: true,
    supportsViewportSearch: true,
    supportsDirectRender: true,
    supportsDownload: true,
    defaultCollections: [
      "sentinel-2-l2a",
      "landsat-c2-l2",
      "naip",
      "sentinel-1-grd",
      "cop-dem-glo-30",
      "cop-dem-glo-90",
    ],
    preferredRenderableKeys: ["rendered_preview", "preview", "visual", "thumbnail", "overview", "data"],
    cloudCoverFields: ["eo:cloud_cover"],
    collectionPreferences: {
      "sentinel-2-l2a": { stylePreset: "rgb", dataKind: "raster" },
      "landsat-c2-l2": { stylePreset: "rgb", dataKind: "raster" },
      "naip": { stylePreset: "rgb", dataKind: "raster" },
      "sentinel-1-grd": { stylePreset: "grayscale", dataKind: "raster" },
      "cop-dem-glo-30": { stylePreset: "dem", dataKind: "elevation" },
      "cop-dem-glo-90": { stylePreset: "dem", dataKind: "elevation" },
    },
  }),

  withWorkerRouting({
    id: "planetary-computer",
    label: "MS Planetary Computer",
    section: "curated",
    sourceType: "stac-api",
    adapterType: "stac-api",
    enabled: true,
    endpointOrUrl: "https://planetarycomputer.microsoft.com/api/stac/v1",
    endpoint: "https://planetarycomputer.microsoft.com/api/stac/v1",
    collectionsEndpoint: "https://planetarycomputer.microsoft.com/api/stac/v1/collections",
    browserRenderable: true,
    supportsViewportSearch: true,
    supportsDirectRender: true,
    supportsDownload: true,
    defaultCollections: [
      "landsat-c2-l2",
      "sentinel-2-l2a",
      "cop-dem-glo-30",
      "cop-dem-glo-90",
      "3dep-seamless",
      "us-census",
    ],
    preferredRenderableKeys: ["rendered_preview", "preview", "visual", "thumbnail", "overview", "image", "data"],
    cloudCoverFields: ["eo:cloud_cover"],
    proxyAssetHosts: [
      "ai4edataeuwest.blob.core.windows.net",
      "ai4edatasetspublicassets.blob.core.windows.net",
      "elevationeuwest.blob.core.windows.net",
      "pcstacitems.blob.core.windows.net",
      "usgslidareuwest.blob.core.windows.net",
    ],
    collectionPreferences: {
      "landsat-c2-l2": { stylePreset: "rgb", dataKind: "raster" },
      "sentinel-2-l2a": { stylePreset: "rgb", dataKind: "raster" },
      "cop-dem-glo-30": { stylePreset: "dem", dataKind: "elevation" },
      "cop-dem-glo-90": { stylePreset: "dem", dataKind: "elevation" },
      "3dep-seamless": { stylePreset: "dem", dataKind: "elevation" },
      "us-census": { stylePreset: "vector", dataKind: "vector" },
    },
  }),

  withWorkerRouting({
    id: "overture-maps",
    label: "Overture Maps Foundation",
    section: "aws-open-data",
    sourceType: "stac-catalog",
    adapterType: "stac-static",
    enabled: true,
    endpointOrUrl: "https://stac.overturemaps.org/catalog.json",
    endpoint: "https://stac.overturemaps.org/catalog.json",
    browserRenderable: false,
    supportsViewportSearch: false,
    supportsDirectRender: false,
    supportsDownload: true,
    defaultCollections: ["buildings", "transportation", "places", "base", "addresses", "divisions"],
    preferredRenderableKeys: ["aws", "azure", "data"],
  }),
];
