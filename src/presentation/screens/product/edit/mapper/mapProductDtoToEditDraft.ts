import { ProductApi } from '../../../../../data/api/ProductApi';
import { ProductDTO, ProductAttributeDto } from '../../../../../data/dto/ProductDTO';
import { EditProductDraft, EditProductImageAsset } from '../../../../../types/editProduct.types';
import { resolveDynamicFormCategoryId } from '../../../../../utils/resolveDynamicFormCategoryId';
import { resolveProductCategoryIds } from '../../../../../utils/resolveProductCategoryIds';
import {
  applyPropertyFieldAliases,
  assignEditDynamicField,
  extractAiRawFields,
  mapAttributesToCanonicalFields,
  normalizeEditFieldKey,
} from '../utils/propertyEditFieldMapping';

const normalizeRemotePath = (path: string): string => {
  const trimmed = path.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      return url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const mapImages = (dto: ProductDTO): EditProductImageAsset[] => {
  const paths = dto.images ?? [];
  return paths.map((path, index) => {
    const remotePath = normalizeRemotePath(path);
    return {
      id: `remote_${index}_${remotePath}`,
      uri: ProductApi.withBase(path),
      remotePath,
      isRemote: true,
      order: index,
    };
  });
};

const resolveCategoryIds = (dto: ProductDTO) => {
  const categoryPath = (dto.categoryPath ?? [])
    .map(item => item._id)
    .filter((id): id is string => Boolean(id?.trim()));

  const categoryId = dto.category?._id ?? categoryPath[0];
  const categoryName = dto.category?.name ?? dto.categoryPath?.[0]?.name;

  let subcategoryId = dto.subcategory?.trim() || undefined;
  if (!subcategoryId && categoryPath.length > 1) {
    subcategoryId = categoryPath[categoryPath.length - 1];
  }

  const subcategoryName =
    dto.categoryPath?.find(item => item._id === subcategoryId)?.name ??
    dto.categoryPath?.[categoryPath.length - 1]?.name;

  const { categoryId: resolvedCategoryId, subcategoryId: resolvedSubcategoryId } =
    resolveProductCategoryIds({
      categoryId,
      subcategoryId,
      dynamicFormCategoryId: resolveDynamicFormCategoryId(subcategoryId, categoryId),
    });

  return {
    categoryId: resolvedCategoryId,
    categoryName,
    subcategoryId: resolvedSubcategoryId,
    subcategoryName,
    categoryPath,
    dynamicFormCategoryId: resolveDynamicFormCategoryId(resolvedSubcategoryId, resolvedCategoryId),
  };
};

const normalizeTitleKey = (title: string): string =>
  title.toLowerCase().replace(/\*+$/, '').trim();

const indexAttributesByTitle = (attributes: ProductAttributeDto[]): Record<string, string> => {
  const index: Record<string, string> = {};
  attributes.forEach(attr => {
    const title = attr.fieldTitle ? normalizeTitleKey(attr.fieldTitle) : '';
    const value = attr.fieldValue?.trim();
    if (title && value) {
      index[normalizeEditFieldKey(title)] = value;
    }
  });
  return index;
};

const buildDynamicFields = (dto: ProductDTO): Record<string, string> => {
  const fields: Record<string, string> = {
    ...mapAttributesToCanonicalFields(dto.productAttributes ?? []),
  };
  const byTitle = indexAttributesByTitle(dto.productAttributes ?? []);

  (dto.productMultiAttributes ?? []).forEach(attr => {
    const key = attr.fieldKey?.trim();
    const values = (attr.fieldValues ?? []).map(v => v.trim()).filter(Boolean);
    if (key && values.length > 0 && key.toLowerCase() !== 'categorypath') {
      assignEditDynamicField(fields, key, values.join(','));
    }
  });

  const aiRawFields = extractAiRawFields(dto.aiExtractedDetails?.raw);
  Object.entries(aiRawFields).forEach(([key, value]) => {
    assignEditDynamicField(fields, key, value);
  });

  Object.assign(fields, applyPropertyFieldAliases(fields));

  const car = dto.carOverview ?? {};
  const assignIfMissing = (key: string, value?: string | number | null) => {
    if (fields[key]?.trim() || value == null || String(value).trim() === '') {
      return;
    }
    fields[key] = String(value);
  };

  const title = dto.title ?? dto.name ?? byTitle.title ?? '';
  const phone =
    dto.contactPhone ??
    dto.phoneNumber ??
    dto.seller?.phone ??
    byTitle[normalizeEditFieldKey('phone number')] ??
    '';
  const priceValue = dto.productPriceValue ?? dto.price ?? byTitle[normalizeEditFieldKey('price')];
  const location =
    dto.location?.trim() ||
    byTitle[normalizeEditFieldKey('location')] ||
    [dto.locateYourItem, dto.area, dto.city, dto.country].filter(Boolean).join(', ');

  assignIfMissing('year', dto.year ?? car.year);
  assignIfMissing('kilometers', dto.kilometers ?? dto.kilometersValue ?? car.kilometers);
  assignIfMissing('fuelType', dto.fuelType ?? car.fuelType);
  assignIfMissing('fueltypeid', dto.fuelType ?? car.fuelType);
  assignIfMissing('transmission', dto.transmission ?? car.transmission);
  assignIfMissing('bodyType', dto.bodyType ?? car.bodyType);
  assignIfMissing('bodytypeid', dto.bodyType ?? car.bodyType);
  assignIfMissing('trim', dto.trim ?? car.trim);
  assignIfMissing('condition', dto.condition ?? car.condition);
  assignIfMissing('exteriorColor', dto.color ?? car.exteriorColor);
  assignIfMissing('exteriorcolorid', dto.color ?? car.exteriorColor);
  assignIfMissing('interiorColor', dto.interiorColor ?? car.interiorColor);
  assignIfMissing('warranty', dto.warranty ?? car.warranty);
  assignIfMissing('warrantyid', dto.warranty ?? car.warranty);
  assignIfMissing('regionalSpecs', dto.regionalSpecsIdValue ?? car.regionalSpecs);
  assignIfMissing('modelid', dto.model ?? car.model);
  assignIfMissing('makeModel', [dto.brand, dto.model ?? car.model].filter(Boolean).join(' ').trim());

  assignIfMissing('title', title);
  assignIfMissing('description', dto.description);
  assignIfMissing('phonenumber', phone);
  assignIfMissing('contactnumber', phone);
  assignIfMissing('phoneNumber', phone);
  assignIfMissing('contactPhone', phone);
  assignIfMissing('phone', phone);
  assignIfMissing('price', priceValue);
  assignIfMissing('productprice', priceValue);
  assignIfMissing('productPrice', priceValue);
  assignIfMissing('location', location);
  assignIfMissing('locateyouritem', dto.locateYourItem ?? dto.area);
  assignIfMissing('cityid', dto.city ?? dto.area);

  return fields;
};

export const mapProductDtoToEditDraft = (dto: ProductDTO): EditProductDraft => {
  const productId = dto._id ?? dto.id ?? '';
  const category = resolveCategoryIds(dto);
  const images = mapImages(dto);
  const dynamicFields = buildDynamicFields(dto);
  const priceValue = dto.productPriceValue ?? dto.price;
  const phone = dto.contactPhone ?? dto.phoneNumber ?? dto.seller?.phone ?? '';

  return {
    productId,
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    subcategoryId: category.subcategoryId,
    subcategoryName: category.subcategoryName,
    categoryPath: category.categoryPath,
    dynamicFormCategoryId: category.dynamicFormCategoryId,
    images,
    removedRemoteImagePaths: [],
    title: dto.title ?? dto.name ?? '',
    description: dto.description ?? '',
    transcript: '',
    dynamicFields,
    price: priceValue != null ? String(priceValue) : '',
    phone: phone ?? '',
    currency: dto.currency ?? 'AED',
    exteriorColor: dto.color ?? dto.carOverview?.exteriorColor ?? dynamicFields.exteriorColor ?? '',
    interiorColor: dto.interiorColor ?? dto.carOverview?.interiorColor ?? dynamicFields.interiorColor ?? '',
    warranty: dto.warranty ?? dto.carOverview?.warranty ?? dynamicFields.warranty ?? '',
    fuelType: dto.fuelType ?? dto.carOverview?.fuelType ?? dynamicFields.fuelType ?? '',
    insuredInUae: dto.carOverview?.isInsured ?? dynamicFields.isInsured ?? '',
    locateYourItem: dto.locateYourItem ?? dto.area ?? '',
    locationAddress: dto.buildingStreetName ?? dto.location ?? '',
    locationLatitude: 24.4539,
    locationLongitude: 54.3773,
    remoteVideoUrl: dto.video ? ProductApi.withBase(dto.video) : undefined,
    video: null,
  };
};
