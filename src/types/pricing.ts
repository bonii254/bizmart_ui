export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PriceCode {
    priceCodeValue: string;
    description: string;
    isDefault: boolean;
    isActive: boolean;
}

export type CreatePriceCodeRequest = PriceCode;

export interface ItemPrice {
    itemId: string;
    priceCode: string;
    sellingPrice: number;
}

export type UpsertItemPriceRequest = ItemPrice;