import { CreatePostCategory, CreatePostSubcategory } from '../types/createPost.types';

export const CREATE_POST_DRAFT_KEY = 'preelly_create_post_draft';

export const MOTORS_ROOT_CATEGORY_ID = '69bd2c24f8f72a46764e165a';
export const DEFAULT_DYNAMIC_FORM_CATEGORY_ID = '69bd32f7f8f72a46764e5553';

export const DYNAMIC_FORM_CATEGORY_ID_BY_SLUG: Record<string, string> = {
  motors: MOTORS_ROOT_CATEGORY_ID,
  used_cars: DEFAULT_DYNAMIC_FORM_CATEGORY_ID,
  'used-cars': DEFAULT_DYNAMIC_FORM_CATEGORY_ID,
  new_cars: '69bd2faef8f72a46764e16b5',
  'new-cars': '69bd2faef8f72a46764e16b5',
  export_cars: '69bd3835f8f72a46764e9248',
  'export-cars': '69bd3835f8f72a46764e9248',
  rental_cars: DEFAULT_DYNAMIC_FORM_CATEGORY_ID,
};

export const CREATE_POST_CATEGORIES: CreatePostCategory[] = [
  { id: 'motors', name: 'Motors', icon: 'car-sports', color: '#FEF3C7' },
  { id: 'property', name: 'Property', icon: 'home-city-outline', color: '#DBEAFE' },
  { id: 'fashion', name: 'Fashion & Accessories', icon: 'tshirt-crew-outline', color: '#FCE7F3' },
  { id: 'furniture', name: 'Furniture & Garden', icon: 'sofa-outline', color: '#DCFCE7' },
  { id: 'classifieds', name: 'Classifieds', icon: 'newspaper-variant-outline', color: '#FFEDD5' },
  { id: 'electronics', name: 'Electronics', icon: 'cellphone', color: '#E0E7FF' },
];

export const CREATE_POST_SUBCATEGORIES: Record<string, CreatePostSubcategory[]> = {
  motors: [
    { id: 'used_cars', name: 'Used Cars' },
    { id: 'new_cars', name: 'New Cars' },
    { id: 'export_cars', name: 'Export Cars' },
    { id: 'rental_cars', name: 'Rental Cars' },
  ],
  property: [
    { id: 'apartments', name: 'Apartments' },
    { id: 'villas', name: 'Villas' },
    { id: 'commercial', name: 'Commercial' },
  ],
  fashion: [
    { id: 'clothing', name: 'Clothing' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'watches', name: 'Watches' },
  ],
  furniture: [
    { id: 'living', name: 'Living Room' },
    { id: 'bedroom', name: 'Bedroom' },
    { id: 'garden', name: 'Garden' },
  ],
  classifieds: [
    { id: 'general', name: 'General' },
    { id: 'services', name: 'Services' },
  ],
  electronics: [
    { id: 'phones', name: 'Mobile Phones' },
    { id: 'laptops', name: 'Laptops' },
    { id: 'gaming', name: 'Gaming' },
  ],
};

export const MOTORS_DYNAMIC_FIELDS = [
  { key: 'emirate', label: 'Emirate', required: true, options: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'RAK', 'Fujairah', 'UAQ'] },
  { key: 'makeModel', label: 'Make & Model', required: true, options: ['Toyota Corolla', 'Lexus ES 350', 'BMW 520i', 'Mercedes C200', 'Nissan Altima'] },
  { key: 'trim', label: 'Trim', required: true, options: ['Base', 'Altis', 'ES 300h', 'M Sport', 'AMG Line'] },
  { key: 'regionalSpecs', label: 'Regional Specs', required: true, options: ['GCC', 'American Specs', 'European Specs', 'Japanese Specs'] },
  { key: 'year', label: 'Year', required: true, options: ['2024', '2023', '2022', '2021', '2020', '2019', '2018'] },
  { key: 'kilometers', label: 'Kilometres', required: true, options: ['0 - 20,000', '20,001 - 50,000', '50,001 - 100,000', '100,001+'] },
  { key: 'bodyType', label: 'Body Type', required: true, options: ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Convertible'] },
  { key: 'fuelType', label: 'Fuel Type', required: true, options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'] },
  { key: 'warranty', label: 'Warranty', required: false, options: ['Yes', 'No', 'Does not apply'] },
  { key: 'exteriorColor', label: 'Exterior Color', required: true, options: ['White', 'Black', 'Silver', 'Blue', 'Red'] },
  { key: 'interiorColor', label: 'Interior Color', required: true, options: ['Black', 'Beige', 'Brown', 'Orange', 'Grey'] },
];

export const VIDEO_CONSTRAINTS = {
  maxSizeBytes: 40 * 1024 * 1024,
  maxDurationSec: 120,
  minDurationSec: 3,
  aspectRatio: 16 / 9,
  aspectTolerance: 0.08,
  maxImages: 10,
  allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/mov'],
};

export const SCREENSHOT_TIMESTAMPS_SEC = [8, 20, 35, 50, 70, 90];
