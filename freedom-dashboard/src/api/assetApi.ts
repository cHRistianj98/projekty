import type {
  Asset,
  AssetCategory,
} from "../types/Asset";

import { authApi } from "./authApi";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080";

type BackendAssetCategory =
  | "CASH"
  | "STOCKS"
  | "CRYPTO"
  | "REAL_ESTATE"
  | "BUSINESS"
  | "VEHICLE"
  | "OTHER";

type BackendAsset = {
  id: number;
  name: string;
  value: number;
  color: string;
  category: BackendAssetCategory;
};

type AssetRequest = {
  name: string;
  value: number;
  color: string;
  category: BackendAssetCategory;
};

function getAuthorizationHeader() {
  const token = authApi.getToken();

  if (!token) {
    throw new Error(
      "Brak tokenu uwierzytelniającego."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function toBackendCategory(
  category?: AssetCategory
): BackendAssetCategory {
  switch (category) {
    case "cash":
      return "CASH";

    case "stocks":
      return "STOCKS";

    case "crypto":
      return "CRYPTO";

    case "realEstate":
      return "REAL_ESTATE";

    case "business":
      return "BUSINESS";

    case "vehicle":
      return "VEHICLE";

    case "other":
    default:
      return "OTHER";
  }
}

function fromBackendCategory(
  category: BackendAssetCategory
): AssetCategory {
  switch (category) {
    case "CASH":
      return "cash";

    case "STOCKS":
      return "stocks";

    case "CRYPTO":
      return "crypto";

    case "REAL_ESTATE":
      return "realEstate";

    case "BUSINESS":
      return "business";

    case "VEHICLE":
      return "vehicle";

    case "OTHER":
    default:
      return "other";
  }
}

function toAssetRequest(
  asset: Asset
): AssetRequest {
  return {
    name: asset.name,
    value: asset.value,
    color: asset.color,
    category: toBackendCategory(
      asset.category
    ),
  };
}

function fromBackendAsset(
  asset: BackendAsset
): Asset {
  return {
    id: asset.id,
    name: asset.name,
    value: Number(asset.value),
    color: asset.color,
    category: fromBackendCategory(
      asset.category
    ),
  };
}

async function handleResponse(
  response: Response
) {
  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      body ||
        `Asset API error: ${response.status}`
    );
  }
}

export const assetApi = {
  async getAll(): Promise<Asset[]> {
    const response = await fetch(
      `${API_URL}/api/assets`,
      {
        headers: {
          ...getAuthorizationHeader(),
        },
      }
    );

    await handleResponse(response);

    const assets =
      (await response.json()) as BackendAsset[];

    return assets.map(
      fromBackendAsset
    );
  },

  async create(
    asset: Asset
  ): Promise<Asset> {
    const response = await fetch(
      `${API_URL}/api/assets`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          ...getAuthorizationHeader(),
        },

        body: JSON.stringify(
          toAssetRequest(asset)
        ),
      }
    );

    await handleResponse(response);

    const created =
      (await response.json()) as BackendAsset;

    return fromBackendAsset(
      created
    );
  },

  async update(
    id: number,
    asset: Asset
  ): Promise<Asset> {
    const response = await fetch(
      `${API_URL}/api/assets/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          ...getAuthorizationHeader(),
        },

        body: JSON.stringify(
          toAssetRequest(asset)
        ),
      }
    );

    await handleResponse(response);

    const updated =
      (await response.json()) as BackendAsset;

    return fromBackendAsset(
      updated
    );
  },

  async remove(
    id: number
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/assets/${id}`,
      {
        method: "DELETE",

        headers: {
          ...getAuthorizationHeader(),
        },
      }
    );

    await handleResponse(response);
  },
};