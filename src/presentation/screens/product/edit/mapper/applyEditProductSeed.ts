import { EditProductDetailSeed, EditProductDraft } from '../../../../../types/editProduct.types';

export const applyEditProductSeed = (
  draft: EditProductDraft,
  seed?: EditProductDetailSeed,
): EditProductDraft => {
  if (!seed) {
    return draft;
  }

  const title = seed.title?.trim() || draft.title;
  const description = seed.description?.trim() || draft.description;
  const price =
    seed.price != null && seed.price > 0 ? String(seed.price) : draft.price;
  const phone = seed.contactPhone?.trim() || draft.phone;
  const locationAddress = seed.locationAddress?.trim() || draft.locationAddress;
  const locateYourItem = seed.locateYourItem?.trim() || draft.locateYourItem;
  const currency = seed.currency?.trim() || draft.currency;

  const dynamicFields = { ...draft.dynamicFields };
  const assignDynamic = (keys: string[], value?: string) => {
    if (!value?.trim()) {
      return;
    }
    keys.forEach(key => {
      if (!dynamicFields[key]?.trim()) {
        dynamicFields[key] = value.trim();
      }
    });
  };

  assignDynamic(['title'], title);
  assignDynamic(['phonenumber', 'phoneNumber', 'contactPhone', 'phone'], phone);
  assignDynamic(['price', 'productprice', 'productPrice'], price);
  assignDynamic(['location', 'locateyouritem', 'cityid'], locateYourItem || locationAddress);

  return {
    ...draft,
    title,
    description,
    price,
    phone,
    currency,
    locationAddress,
    locateYourItem,
    dynamicFields,
  };
};
