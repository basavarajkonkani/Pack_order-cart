import { ImageSourcePropType } from 'react-native';

export interface StockSize {
  code: string;
  label: string; // dimensions, e.g. "10.5 x 17 x 3 cm"
  weight: string; // e.g. "100 g"
  pricePerPiece: number;
}

export interface ProductColor {
  name: string;
  hexCode?: string; // Optional hex color code for display
  available: boolean;
}

export interface StockProduct {
  id: string;
  name: string;
  desc: string;
  image: ImageSourcePropType;
  size: 'Small' | 'Medium' | 'Large';
  micron: number;
  material: string;
  sealing: string;
  heatResistance: string;
  moq: number;
  inStock: boolean;
  sizes: StockSize[];
  sortOrder?: number; // Optional field for controlling display order
  colors?: ProductColor[]; // Optional color variants
}

// Standard 4-size ladder shared by most stand up pouches, scaled per base price.
function sizeLadder(base: {
  s1: number; s2: number; s3: number; s4: number;
}, prefix: string): StockSize[] {
  return [
    { code: `${prefix}1`, label: '10.5 x 17 x 3 cm', weight: '100 g', pricePerPiece: base.s1 },
    { code: `${prefix}2`, label: '13.5 x 20.5 x 3.5 cm', weight: '250 g', pricePerPiece: base.s2 },
    { code: `${prefix}3`, label: '15 x 20.5 x 3.5 cm', weight: '500 g', pricePerPiece: base.s3 },
    { code: `${prefix}4`, label: '18 x 25 x 4 cm', weight: '1000 g', pricePerPiece: base.s4 },
  ];
}

export const STOCK_PRODUCTS: StockProduct[] = [
  {
    id: 'matt-standy-zipper-pouch',
    name: 'Matt Standy Zipper Pouch',
    desc: 'Elegant matte finish standy pouch with zipper, 3 sides sealed with bottom gusset and tear notch. Perfect for premium packaging.',
    image: require('@/assets/images/gold-standy-pouch.jpg'), // Update with actual matt pouch image
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sortOrder: 1,
    colors: [
      { name: 'Black', hexCode: '#000000', available: true },
      { name: 'White', hexCode: '#FFFFFF', available: true },
      { name: 'Red', hexCode: '#FF0000', available: true },
      { name: 'Blue', hexCode: '#0000FF', available: true },
      { name: 'Green', hexCode: '#008000', available: true },
    ],
    sizes: [
      { code: 'MSZP1', label: '10.5 x 17 + 3 cm', weight: '100 g', pricePerPiece: 3.15 },
      { code: 'MSZP2', label: '13.5 x 22 + 3.5 cm', weight: '250 g', pricePerPiece: 5.15 },
      { code: 'MSZP3', label: '16 x 23 + 3.5 cm', weight: '500 g', pricePerPiece: 6.25 },
      { code: 'MSZP4', label: '17 x 26.5 + 4 cm', weight: '1000 g', pricePerPiece: 7.60 },
    ],
  },
  {
    id: 'matt-window-standy-zipper-pouch',
    name: 'Matt Window Standy Zipper Pouch',
    desc: 'Premium matte finish standy pouch with transparent window and zipper. Perfect for showcasing products while maintaining elegant aesthetics.',
    image: require('@/assets/images/gold-standy-pouch.jpg'), // Update with actual matt window pouch image
    size: 'Medium',
    micron: 135,
    material: 'PET + Poly + Window',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sortOrder: 2,
    colors: [
      { name: 'Black', hexCode: '#000000', available: true },
      { name: 'White', hexCode: '#FFFFFF', available: true },
      { name: 'Red', hexCode: '#FF0000', available: true },
      { name: 'Blue', hexCode: '#0000FF', available: true },
      { name: 'Green', hexCode: '#008000', available: true },
      { name: 'Silver', hexCode: '#C0C0C0', available: true },
      { name: 'Gold', hexCode: '#FFD700', available: true },
      { name: 'Pink', hexCode: '#FFC0CB', available: true },
    ],
    sizes: [
      { code: 'MWSZP1', label: '10 x 15 + 3 cm', weight: '50 g', pricePerPiece: 4.25 },
      { code: 'MWSZP2', label: '12 x 20 + 4 cm', weight: '100 g', pricePerPiece: 5.42 },
      { code: 'MWSZP3', label: '14 x 20 + 4 cm', weight: '250 g', pricePerPiece: 5.75 },
      { code: 'MWSZP4', label: '16 x 22 + 4 cm', weight: '500 g', pricePerPiece: 7.16 },
      { code: 'MWSZP5', label: '18 x 26 + 4 cm', weight: '1000 g', pricePerPiece: 8.83 },
    ],
  },
  {
    id: 'gold-standy',
    name: 'Gold Standy Pouch',
    desc: 'Premium gold standy pouch with excellent barrier properties, perfect for premium products and long shelf life.',
    image: require('@/assets/images/gold-standy-pouch.jpg'),
    size: 'Medium',
    micron: 112,
    material: 'Metalized',
    sealing: 'Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: sizeLadder({ s1: 2.45, s2: 3.85, s3: 4.25, s4: 6.15 }, 'GSP'),
  },
  {
    id: 'gold-standy-zipper',
    name: 'Gold Standy Zipper Pouch',
    desc: 'Shiny gold in colour, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing dry fruits, herbs, grains, tea/coffee powder, spices etc.',
    image: require('@/assets/images/gold-standy-zipper-pouch.jpg'),
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'GSZP1', label: '10.5 x 17 + 3 cm', weight: '100 g', pricePerPiece: 3.15 },
      { code: 'GSZP2', label: '13.5 x 22 + 3.5 cm', weight: '250 g', pricePerPiece: 5.15 },
      { code: 'GSZP3', label: '16 x 23 + 3.5 cm', weight: '500 g', pricePerPiece: 6.25 },
      { code: 'GSZP4', label: '17 x 26.5 + 4 cm', weight: '1000 g', pricePerPiece: 7.60 },
    ],
  },
  {
    id: 'silver-standy',
    name: 'Silver Standy Pouch',
    desc: 'Shiny silver standy pouch, 3 sides sealed with bottom gusset and tear notch. Ideal for packing dry fruits, protein powder, spices, tea/coffee powder, seeds etc.',
    image: require('@/assets/images/silver-standy-pouch.jpg'),
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'SSP1', label: '8.5 x 13.5 + 2.5 cm', weight: '50 g', pricePerPiece: 1.35 },
      { code: 'SSP2', label: '10.5 x 17 + 3 cm', weight: '100 g', pricePerPiece: 2.10 },
      { code: 'SSP3', label: '10.5 x 20.5 + 3.5 cm', weight: '200 g', pricePerPiece: 2.50 },
      { code: 'SSP4', label: '13.5 x 20.5 + 3.5 cm', weight: '250 g', pricePerPiece: 3.20 },
      { code: 'SSP5', label: '15 x 20.5 + 3.5 cm', weight: '500 g', pricePerPiece: 3.60 },
      { code: 'SSP6', label: '18 x 25 + 4 cm', weight: '1000 g', pricePerPiece: 5.25 },
      { code: 'SSP7', label: '20 x 30 + 5 cm', weight: '2000 g', pricePerPiece: 6.96 },
    ],
  },
  {
    id: 'silver-standy-zipper',
    name: 'Silver Standy Zipper Pouch',
    desc: 'Shiny silver standy pouch, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing dry fruits, pickle, confectionery, herbs, spices etc.',
    image: require('@/assets/images/silver-standy-zipper-pouch.jpg'),
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'SSZP1', label: '10 x 13.5 + 2.5 cm', weight: '50 g', pricePerPiece: 2.10 },
      { code: 'SSZP2', label: '10 x 17 + 3.5 cm', weight: '100 g', pricePerPiece: 2.55 },
      { code: 'SSZP3', label: '10.5 x 21 + 3.5 cm', weight: '200 g', pricePerPiece: 3.05 },
      { code: 'SSZP4', label: '13.5 x 22 + 3.5 cm', weight: '250 g', pricePerPiece: 4.15 },
      { code: 'SSZP5', label: '16 x 23 + 3.5 cm', weight: '500 g', pricePerPiece: 5.00 },
      { code: 'SSZP6', label: '17 x 26.5 + 4 cm', weight: '1000 g', pricePerPiece: 6.05 },
      { code: 'SSZP7', label: '20 x 30 + 5 cm', weight: '2000 g', pricePerPiece: 8.10 },
    ],
  },
  {
    id: 'kraft-standy',
    name: 'Kraft Standy Pouch (Brown)',
    desc: 'Brown in colour, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing dry fruits, grains, herbs, tea/coffee powder, spices etc.',
    image: require('@/assets/images/kraft-standy-pouch-brown.jpg'),
    size: 'Medium',
    micron: 140,
    material: 'Kraft Paper + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'KSP1', label: '11 x 18.5 + 3 cm', weight: '100 g', pricePerPiece: 4.75 },
      { code: 'KSP2', label: '13 x 21 + 4 cm', weight: '200 g', pricePerPiece: 6.16 },
      { code: 'KSP3', label: '15 x 21 + 4 cm', weight: '250 g', pricePerPiece: 6.83 },
      { code: 'KSP4', label: '15 x 24 + 4 cm', weight: '500 g', pricePerPiece: 7.50 },
      { code: 'KSP5', label: '18 x 26 + 4 cm', weight: '1000 g', pricePerPiece: 9.50 },
    ],
  },
  {
    id: 'kraft-window-standy-brown',
    name: 'Kraft Window Standy Pouch (Brown)',
    desc: 'Brown in colour, 3 sides sealed with bottom gusset, tear notch, zipper and window. Ideal for packing dry fruits, protein powder, spices, grains etc.',
    image: require('@/assets/images/kraft-window-standy-pouch-brown.jpg'),
    size: 'Medium',
    micron: 135,
    material: 'Kraft Paper + Poly + Window',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'KWSP1', label: '10 x 15 + 3 cm', weight: '50 g', pricePerPiece: 4.25 },
      { code: 'KWSP2', label: '12 x 20 + 4 cm', weight: '100 g', pricePerPiece: 5.42 },
      { code: 'KWSP3', label: '14 x 20 + 4 cm', weight: '250 g', pricePerPiece: 5.75 },
      { code: 'KWSP4', label: '16 x 22 + 4 cm', weight: '500 g', pricePerPiece: 7.16 },
      { code: 'KWSP5', label: '18 x 26 + 4 cm', weight: '1000 g', pricePerPiece: 8.83 },
      { code: 'KWSP6', label: '20 x 30 + 5 cm', weight: '2000 g', pricePerPiece: 11.58 },
      { code: 'KWSP7', label: '30 x 40 + 6 cm', weight: '3000 g', pricePerPiece: 22.66 },
    ],
  },
  {
    id: 'kraft-window-standy-white',
    name: 'Kraft Window Standy Pouch (White)',
    desc: 'White in colour, 3 sides sealed with bottom gusset, tear notch, zipper and window. Ideal for packing dry fruits, grains, tea/coffee powder, herbs, confectionery etc.',
    image: require('@/assets/images/kraft-window-standy-pouch-white.jpg'),
    size: 'Medium',
    micron: 135,
    material: 'Kraft Paper + Poly + Window',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'KWSP1', label: '12 x 20 + 4 cm', weight: '100 g', pricePerPiece: 6.41 },
      { code: 'KWSP2', label: '14 x 20 + 4 cm', weight: '250 g', pricePerPiece: 7.50 },
      { code: 'KWSP3', label: '15 x 22 + 4 cm', weight: '500 g', pricePerPiece: 8.50 },
      { code: 'KWSP4', label: '18 x 26 + 4 cm', weight: '1000 g', pricePerPiece: 10.80 },
    ],
  },
  {
    id: 'milky-standy',
    name: 'Milky Standy Pouch',
    desc: 'White in colour, 3 side sealed with bottom gusset and tear notch. Ideal for packing dry fruits, grains, protein powder, seeds, herbs etc.',
    image: require('@/assets/images/milky-standy-pouch.jpg'),
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'MSP1', label: '10.5 x 17 + 3 cm', weight: '100 g', pricePerPiece: 2.10 },
      { code: 'MSP2', label: '13.5 x 20.5 + 3.5 cm', weight: '250 g', pricePerPiece: 3.25 },
      { code: 'MSP3', label: '15 x 20.5 + 3.5 cm', weight: '500 g', pricePerPiece: 3.60 },
      { code: 'MSP4', label: '18 x 25 + 4 cm', weight: '1000 g', pricePerPiece: 5.25 },
    ],
  },
  {
    id: 'milky-standy-zipper',
    name: 'Milky Standy Zipper Pouch',
    desc: 'White in colour, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing dry fruits, grains, confectionery, seeds, pickle etc.',
    image: require('@/assets/images/milky-standy-zipper-pouch.jpg'),
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'MSZP1', label: '10 x 17 + 3.5 cm', weight: '100 g', pricePerPiece: 2.55 },
      { code: 'MSZP2', label: '13.5 x 22 + 3.5 cm', weight: '250 g', pricePerPiece: 4.15 },
      { code: 'MSZP3', label: '16 x 23 + 3.5 cm', weight: '500 g', pricePerPiece: 5.00 },
      { code: 'MSZP4', label: '17 x 26.5 + 4 cm', weight: '1000 g', pricePerPiece: 6.05 },
    ],
  },
  {
    id: 'center-seal',
    name: 'Center Seal Pouch',
    desc: 'Classic center seal (pillow) pouch, a cost-effective flat pouch ideal for high-volume packing of snacks and grains.',
    image: require('@/assets/images/center-seal-pouch.jpg'),
    size: 'Small',
    micron: 90,
    material: 'Laminate',
    sealing: 'Heat sealable',
    heatResistance: '85°C',
    moq: 500,
    inStock: true,
    sizes: [
      { code: 'CSP1', label: '10 x 15 cm', weight: '100 g', pricePerPiece: 1.45 },
      { code: 'CSP2', label: '15 x 22 cm', weight: '250 g', pricePerPiece: 2.15 },
      { code: 'CSP3', label: '20 x 28 cm', weight: '500 g', pricePerPiece: 2.85 },
      { code: 'CSP4', label: '25 x 35 cm', weight: '1000 g', pricePerPiece: 3.95 },
    ],
  },
  {
    id: 'batter-pouch',
    name: 'Idly Dosa Batter Pouch',
    desc: 'White in colour, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing idly / dosa batter.',
    image: require('@/assets/images/batter-pouch.jpg'),
    size: 'Small',
    micron: 72,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'IDBP1', label: '27 x 21 + 5 cm', weight: '1000 g', pricePerPiece: 9.65 },
    ],
  },
];

export function getStockProduct(id: string): StockProduct | undefined {
  return STOCK_PRODUCTS.find((p) => p.id === id);
}

export function getMinPrice(product: StockProduct): number {
  if (!product.sizes || product.sizes.length === 0) return 0;
  return Math.min(...product.sizes.map((s) => s.pricePerPiece));
}
