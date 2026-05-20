export interface FurColor {
  primary: string;
  secondary: string;
}

export interface EyeColor {
  primary: string;
  secondary: string;
}

export interface CompanionConfig {
  furColor: FurColor;
  eyeColor: EyeColor;
  noseColor: string;
  clothingTop: string;
  clothingBottom: string;
  ears: string;
  tail: string;
  backpack: string;
  bodyMorphs: Record<string, number>;
}
