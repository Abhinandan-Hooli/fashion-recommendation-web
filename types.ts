
export interface Product {
  ProductID: string;
  ProductName: string;
  ProductBrand: string;
  Gender: string;
  Price: number;
  NumImages: number;
  Description: string;
  PrimaryColor: string;
}

export interface OutfitSelection {
  top: Product | null;
  bottom: Product | null;
  footwear: Product | null;
  accessory: Product | null;
}

export interface AIRecommendation {
  outfit: OutfitSelection;
  style_tags: string[];
  color_palette: string[];
  reasoning: string;
  occasion: string;
}
