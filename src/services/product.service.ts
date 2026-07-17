import { Product } from '../domain/models/Product';
import { ProductApi } from '../data/api/ProductApi';
import {
  ProductAttributeDto,
  ProductCarOverviewDTO,
  ProductDTO,
  ProductMultiAttributeDto,
  ProductVehicleFeatureDTO,
} from '../data/dto/ProductDTO';
import { extractProductLocationCoordinates } from '../utils/resolveLocationCoordinates';
import {
  ProductAttribute,
  ProductDetailView,
  ProductFeatureSection,
  ProductMultiAttribute,
  ProductOverviewSpec,
  ProductSellerInfo,
  SimilarAdItem,
} from '../types/product.types';

const DEFAULT_FEATURES: ProductFeatureSection[] = [
  {
    id: 'safety',
    title: 'Driver Assistance & Safety',
    count: 0,
    items: [],
  },
  {
    id: 'tech',
    title: 'Entertainment & Technology',
    count: 0,
    items: [],
  },
  {
    id: 'comfort',
    title: 'Comfort & Convenience',
    count: 0,
    items: [],
  },
  {
    id: 'exterior',
    title: 'Exterior',
    count: 0,
    items: [],
  },
];

const CATEGORY_ICON_BY_NAME: Record<string, string> = {
  motors: 'car-sports',
  property: 'home-city-outline',
  fashion: 'hanger',
  'fashion & accessories': 'hanger',
  electronics: 'cellphone',
  'mobiles & tablets': 'cellphone',
  classifieds: 'newspaper-variant-outline',
  jobs: 'briefcase-outline',
  services: 'tools',
  'furniture & garden': 'sofa-outline',
};

const formatPostedDate = (isoDate?: string): string => {
  if (!isoDate) {
    return 'Recently';
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
};

const formatMileage = (dto: ProductDTO): string => {
  const raw = dto.kilometersValue ?? dto.kilometers ?? dto.carOverview?.kilometers;
  if (raw == null || raw === '') {
    return '—';
  }
  const numeric = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''));
  if (!Number.isNaN(numeric) && numeric > 0) {
    return `${numeric.toLocaleString()} km`;
  }
  return String(raw);
};

const formatYear = (dto: ProductDTO): string => {
  const raw = dto.year ?? dto.carOverview?.year;
  return raw != null && String(raw).trim() ? String(raw) : '—';
};

const formatSpecsLabel = (dto: ProductDTO): string =>
  dto.regionalSpecsIdValue ?? dto.carOverview?.regionalSpecs ?? '—';

const resolveAvailability = (dto: ProductDTO): string => {
  if (dto.isSold) {
    return 'Sold';
  }
  if (dto.status === 'inactive') {
    return 'Unavailable';
  }
  return 'Available';
};

const resolveSellerRole = (dto: ProductDTO): string => {
  const status = dto.seller?.identityVerificationStatus;
  if (status && status !== 'none') {
    return 'Verified Seller';
  }
  return dto.seller?.isVerified ? 'Dealer' : 'Seller';
};

const mapDtoToProduct = (dto: ProductDTO): Product => {
  const id = dto._id ?? dto.id ?? `product_${Date.now()}`;
  const imagePaths = dto.images ?? [];
  const images = imagePaths.map(path => ProductApi.withBase(path));
  const imageUrl = images[0] ?? '';
  const seller = dto.seller;
  const contactPhone = dto.contactPhone ?? dto.phoneNumber ?? seller?.phone ?? undefined;

  return {
    id,
    title: dto.title ?? dto.name ?? 'Untitled Product',
    description: dto.description ?? '',
    price: typeof dto.productPriceValue === 'number' ? dto.productPriceValue : (dto.price ?? 0),
    currency: dto.currency ?? 'AED',
    videoUrl: dto.video ? ProductApi.withBase(dto.video) : '',
    imageUrl,
    images: images.length > 0 ? images : undefined,
    location:
      dto.location ??
      ([dto.area, dto.city, dto.country].filter(Boolean).join(', ') || 'UAE'),
    likesCount: dto.likes?.length ?? 0,
    views: dto.views ?? 0,
    isSaved: Boolean(dto.saved ?? dto.isSaved),
    isViewed: Boolean(dto.isViewed ?? dto.viewed),
    isSold: Boolean(dto.isSold),
    createdAt: dto.createdAt ?? new Date().toISOString(),
    user: seller?.name
      ? { name: seller.name, avatar: seller.avatar ? ProductApi.withBase(seller.avatar) : undefined }
      : dto.user?.name
        ? { name: dto.user.name, avatar: dto.user.avatar ? ProductApi.withBase(dto.user.avatar) : undefined }
        : undefined,
    seller: seller?._id || seller?.id
      ? {
          id: seller._id ?? seller.id ?? '',
          name: seller.name,
          avatar: seller.avatar ? ProductApi.withBase(seller.avatar) : undefined,
          isVerified: seller.isVerified,
        }
      : undefined,
    liked: Boolean(dto.liked ?? dto.isLiked),
    saved: Boolean(dto.saved ?? dto.isSaved),
    isPaused: false,
    contactOptions: dto.contactOptions
      ? {
          inAppChat: Boolean(dto.contactOptions.inAppChat),
          call: Boolean(dto.contactOptions.call),
          whatsapp: Boolean(dto.contactOptions.whatsapp),
        }
      : undefined,
    contactName: dto.contactName ?? seller?.name,
    contactPhone: contactPhone ?? undefined,
  };
};

const buildImages = (dto: ProductDTO, product: Product): string[] => {
  const fromDto = (dto.images ?? []).map(img => ProductApi.withBase(img));
  if (fromDto.length > 0) {
    return fromDto;
  }
  if (product.imageUrl) {
    return [product.imageUrl];
  }
  const seed = product.id.replace(/\W/g, '');
  return [`https://picsum.photos/seed/${seed}-1/1080/720`];
};

const overviewValue = (value?: string | number | null): string => {
  if (value == null || value === '') {
    return '—';
  }
  return String(value);
};

const buildOverviewFromCarOverview = (
  overview: ProductCarOverviewDTO,
  dto: ProductDTO,
): ProductOverviewSpec[] => [
  { label: 'Interior Color', value: overviewValue(overview.interiorColor) },
  { label: 'Horsepower', value: overviewValue(overview.horsepower) },
  { label: 'Doors', value: overviewValue(overview.doors) },
  { label: 'Fuel Type', value: overviewValue(overview.fuelType) },
  { label: 'Transmission Type', value: overviewValue(overview.transmission) },
  { label: 'Warranty', value: overviewValue(overview.warranty) },
  { label: 'Trim', value: overviewValue(overview.trim) },
  { label: 'Exterior Color', value: overviewValue(overview.exteriorColor) },
  { label: 'Body Type', value: overviewValue(overview.bodyType) },
  { label: 'No. of Cylinders', value: overviewValue(overview.cylinders) },
  { label: 'Seller type', value: resolveSellerRole(dto) },
  { label: 'Target Market', value: overviewValue(overview.regionalSpecs) },
];

const mapProductAttribute = (field: ProductAttributeDto): ProductAttribute | null => {
  const fieldTitle = field.fieldTitle?.trim();
  const fieldValue = field.fieldValue?.trim();
  if (!fieldTitle || !fieldValue) {
    return null;
  }
  return {
    fieldKey: field.fieldKey?.trim() ?? fieldTitle,
    fieldTitle,
    fieldValue,
  };
};

/** Deduplicate API attributes (e.g. `bodytypeid` vs `bodyTypeId`) by normalized field key. */
const buildProductAttributes = (dto: ProductDTO): ProductAttribute[] => {
  const seenKeys = new Set<string>();
  const attributes: ProductAttribute[] = [];

  (dto.productAttributes ?? []).forEach(field => {
    const mapped = mapProductAttribute(field);
    if (!mapped) {
      return;
    }
    const dedupeKey = mapped.fieldKey.toLowerCase();
    if (seenKeys.has(dedupeKey)) {
      return;
    }
    seenKeys.add(dedupeKey);
    attributes.push(mapped);
  });

  return attributes;
};

const buildOverview = (dto: ProductDTO): ProductOverviewSpec[] => {
  if (dto.carOverview && Object.keys(dto.carOverview).length > 0) {
    return buildOverviewFromCarOverview(dto.carOverview, dto);
  }

  return [
    { label: 'Interior Color', value: overviewValue(dto.interiorColor) },
    { label: 'Horsepower', value: '—' },
    { label: 'Doors', value: overviewValue(dto.doors) },
    { label: 'Fuel Type', value: overviewValue(dto.fuelType) },
    { label: 'Transmission Type', value: overviewValue(dto.transmission) },
    { label: 'Warranty', value: overviewValue(dto.warranty) },
    { label: 'Trim', value: overviewValue(dto.trim) },
    { label: 'Exterior Color', value: overviewValue(dto.color) },
    { label: 'Body Type', value: overviewValue(dto.bodyType) },
    { label: 'No. of Cylinders', value: '—' },
    { label: 'Seller type', value: resolveSellerRole(dto) },
    { label: 'Target Market', value: formatSpecsLabel(dto) },
  ];
};

const slugifyFeatureId = (title: string, index: number): string =>
  `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'feature'}-${index}`;

const resolveCategoryName = (dto: ProductDTO): string | undefined =>
  dto.category?.name ?? dto.categoryPath?.[0]?.name;

const isMotorsCategory = (dto: ProductDTO): boolean =>
  resolveCategoryName(dto)?.trim().toLowerCase() === 'motors';

const mapVehicleFeaturesToMultiAttributes = (
  sections: ProductVehicleFeatureDTO[],
): ProductMultiAttribute[] =>
  sections.map((section, index) => {
    const fieldValues = section.items ?? [];
    return {
      id: slugifyFeatureId(section.title, index),
      fieldKey: slugifyFeatureId(section.title, index),
      fieldTitle: section.title,
      count: fieldValues.length,
      fieldValues,
    };
  });

const hasNonCategoryPathMultiAttributes = (fields: ProductMultiAttributeDto[]): boolean =>
  fields.some(field => {
    const key = (field.fieldKey ?? '').toLowerCase();
    const values = (field.fieldValues ?? []).filter(value => value?.trim());
    return key !== 'categorypath' && values.length > 0;
  });

const buildProductMultiAttributes = (dto: ProductDTO): ProductMultiAttribute[] => {
  const apiFields = dto.productMultiAttributes ?? [];
  const skipCategoryPath = hasNonCategoryPathMultiAttributes(apiFields);
  const seenKeys = new Set<string>();
  const seenItemSets = new Set<string>();
  const attributes: ProductMultiAttribute[] = [];

  apiFields.forEach((field: ProductMultiAttributeDto, index) => {
    const fieldKey = (field.fieldKey ?? '').trim();
    const fieldTitle = (field.fieldTitle ?? '').trim();
    const fieldValues = (field.fieldValues ?? []).map(value => value.trim()).filter(Boolean);

    if (!fieldTitle || fieldValues.length === 0) {
      return;
    }

    const dedupeKey = fieldKey.toLowerCase();
    // Hide breadcrumb-only rows when real feature groups are also present (e.g. Motors).
    if (dedupeKey === 'categorypath' && skipCategoryPath) {
      return;
    }
    if (seenKeys.has(dedupeKey)) {
      return;
    }

    const itemsSignature = fieldValues.join('\0').toLowerCase();
    if (seenItemSets.has(itemsSignature)) {
      return;
    }

    seenKeys.add(dedupeKey);
    seenItemSets.add(itemsSignature);
    attributes.push({
      id: slugifyFeatureId(fieldTitle, index),
      fieldKey: fieldKey || fieldTitle,
      fieldTitle,
      count: fieldValues.length,
      fieldValues,
    });
  });

  if (attributes.length > 0) {
    return attributes;
  }

  if (isMotorsCategory(dto)) {
    return mapVehicleFeaturesToMultiAttributes(dto.vehicleFeatures ?? []);
  }

  return [];
};

const buildFeatureSections = (dto: ProductDTO): ProductFeatureSection[] => {
  const fromApi = dto.vehicleFeatures ?? [];
  if (fromApi.length > 0) {
    return fromApi.map((section: ProductVehicleFeatureDTO, index) => ({
      id: slugifyFeatureId(section.title, index),
      title: section.title,
      count: section.items?.length ?? 0,
      items: section.items ?? [],
    }));
  }
  return DEFAULT_FEATURES;
};

const buildLocation = (dto: ProductDTO) => {
  const title = [dto.area, dto.city, dto.country].filter(Boolean).join(', ').toUpperCase()
    || dto.location?.toUpperCase()
    || 'UAE';
  const addressParts = [dto.buildingStreetName, dto.locateYourItem, dto.location].filter(Boolean);
  const locationAddress = addressParts.length
    ? addressParts.join(', ')
    : dto.location ?? title;

  const rootCoordinates = extractProductLocationCoordinates(
    dto as unknown as Record<string, unknown>,
  );
  const nestedCoordinates = extractProductLocationCoordinates(dto.additionalFields);
  const locationLatitude = rootCoordinates.latitude ?? nestedCoordinates.latitude;
  const locationLongitude = rootCoordinates.longitude ?? nestedCoordinates.longitude;

  return {
    locationTitle: title,
    locationAddress,
    locationLatitude,
    locationLongitude,
  };
};

const buildSeller = (dto: ProductDTO, product: Product): ProductSellerInfo => {
  const seller = dto.seller;
  return {
    id: seller?._id ?? seller?.id ?? product.seller?.id ?? 'seller_1',
    name: seller?.name ?? product.user?.name ?? 'Seller',
    role: resolveSellerRole(dto),
    avatar:
      (seller?.avatar ? ProductApi.withBase(seller.avatar) : undefined) ??
      product.user?.avatar ??
      product.seller?.avatar,
    postsCount: 0,
    followingCount: 0,
  };
};

const buildCategories = (dto: ProductDTO) => {
  const path = dto.categoryPath ?? [];
  if (path.length > 0) {
    return path.map(item => {
      const key = (item.slug ?? item.name ?? '').toLowerCase();
      return {
        id: item._id ?? key,
        title: item.name ?? 'Category',
        icon: CATEGORY_ICON_BY_NAME[key] ?? 'shape-outline',
      };
    });
  }

  if (dto.category?.name) {
    const key = (dto.category.slug ?? dto.category.name).toLowerCase();
    return [
      {
        id: dto.category._id ?? key,
        title: dto.category.name,
        icon: CATEGORY_ICON_BY_NAME[key] ?? 'shape-outline',
      },
    ];
  }

  return [];
};

const buildSimilar = async (productId: string): Promise<SimilarAdItem[]> => {
  try {
    const response = await ProductApi.getProducts(1, 8);
    return response.products
      .filter(item => (item._id ?? item.id) !== productId)
      .slice(0, 6)
      .map((item, index) => {
        const id = item._id ?? item.id ?? `sim_${index}`;
        const image = item.images?.[0] ? ProductApi.withBase(item.images[0]) : '';
        return {
          id,
          title: item.title ?? 'Premium Vehicle',
          year: item.year ? String(item.year) : '—',
          mileage: formatMileage(item),
          price: item.price ?? 0,
          currency: item.currency ?? 'AED',
          imageUrl: image,
          location: item.location ?? item.city ?? 'UAE',
          postedAgo: formatPostedDate(item.createdAt),
          availability: resolveAvailability(item),
        };
      });
  } catch {
    return [];
  }
};

export const mapProductDetailView = async (
  dto: ProductDTO,
  seedProduct?: Product,
): Promise<ProductDetailView> => {
  const product = seedProduct ?? mapDtoToProduct(dto);
  const location = buildLocation(dto);
  const productAttributes = buildProductAttributes(dto);
  const categoryName = resolveCategoryName(dto);
  const productMultiAttributes = buildProductMultiAttributes(dto);
  const showFeatureSection = productMultiAttributes.length > 0;
  const overviewSpecs =
    productAttributes.length > 0
      ? productAttributes.map(attr => ({
          label: attr.fieldTitle,
          value: attr.fieldValue,
        }))
      : buildOverview(dto);

  return {
    product,
    images: buildImages(dto, product),
    viewsCount: dto.views ?? 0,
    sharesCount: 0,
    commentsCount: 0,
    year: formatYear(dto),
    mileage: formatMileage(dto),
    specsLabel: formatSpecsLabel(dto),
    postedOnLabel: formatPostedDate(dto.createdAt),
    availability: resolveAvailability(dto),
    descriptionTitle: product.title,
    description: product.description || 'No description provided.',
    overviewSpecs,
    productAttributes,
    productMultiAttributes,
    featureSections: buildFeatureSections(dto),
    categoryName,
    showFeatureSection,
    locationTitle: location.locationTitle,
    locationAddress: location.locationAddress,
    locationLatitude: location.locationLatitude,
    locationLongitude: location.locationLongitude,
    seller: buildSeller(dto, product),
    similarAds: await buildSimilar(product.id),
    categories: buildCategories(dto),
    contactOptions: product.contactOptions,
    contactName: product.contactName,
    contactPhone: product.contactPhone,
  };
};

export const mapProductDetailFromProduct = async (product: Product): Promise<ProductDetailView> => {
  const dto: ProductDTO = {
    _id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    currency: product.currency,
    images: product.imageUrl ? [product.imageUrl] : [],
    video: product.videoUrl,
    location: product.location,
    createdAt: product.createdAt,
    user: product.user,
    contactOptions: product.contactOptions,
    contactName: product.contactName,
    contactPhone: product.contactPhone,
  };
  return mapProductDetailView(dto, product);
};

/**
 * Product detail fetch (`GET /api/products/:id`).
 */
export const getProductDetailById = async (
  productId: string,
  seedProduct?: Product,
): Promise<ProductDetailView> => {
  try {
    const dto = await ProductApi.getProductById(productId);
    return mapProductDetailView(dto, seedProduct);
  } catch {
    if (seedProduct) {
      return mapProductDetailFromProduct(seedProduct);
    }
    throw new Error('Product not found');
  }
};
