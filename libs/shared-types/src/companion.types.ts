export interface FurColor {
  primary: string;
  secondary: string;
}

export interface CompanionConfig {
  furColor: FurColor;
  eyes: string;
  nose: string;
  clothing: string;
  ears: string;
  tail: string;
  backpack: string;
  bodyMorphs: Record<string, number>;
}
