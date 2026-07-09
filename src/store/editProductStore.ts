import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EDIT_PRODUCT_DRAFT_KEY } from '../constants/editProductConstants';
import { EditProductDraft, EditProductImageAsset } from '../types/editProduct.types';
import { resolveDynamicFormCategoryId } from '../utils/resolveDynamicFormCategoryId';
import { resolveProductCategoryIds } from '../utils/resolveProductCategoryIds';

const emptyDraft = (): EditProductDraft => ({
  images: [],
  title: '',
  description: '',
  transcript: '',
  dynamicFields: {},
  price: '',
  phone: '',
  exteriorColor: '',
  interiorColor: '',
  warranty: '',
  fuelType: '',
  insuredInUae: '',
  locateYourItem: '',
  locationAddress: '',
  locationLatitude: 24.4539,
  locationLongitude: 54.3773,
  currency: 'AED',
  categoryPath: [],
  removedRemoteImagePaths: [],
});

interface EditProductStore extends EditProductDraft {
  isHydrated: boolean;
  setProductId: (id: string) => void;
  initFromDraft: (draft: EditProductDraft) => void;
  setCategory: (id: string, name: string) => void;
  setSubcategory: (id: string, name: string) => void;
  setPropertySubcategory: (parentId: string, subcategoryId: string, name: string) => void;
  setCategoryPath: (path: string[]) => void;
  setVideo: (video: EditProductDraft['video']) => void;
  setRemoteVideoUrl: (url?: string) => void;
  setImages: (images: EditProductImageAsset[]) => void;
  addImages: (images: EditProductImageAsset[]) => void;
  removeImage: (id: string) => void;
  replaceImage: (id: string, updates: Partial<Omit<EditProductImageAsset, 'id'>>) => void;
  updateImage: (id: string, updates: Partial<Pick<EditProductImageAsset, 'caption' | 'order'>>) => void;
  reorderImages: (from: number, to: number) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setTranscript: (transcript: string) => void;
  setDynamicField: (key: string, value: string) => void;
  setDynamicFields: (fields: Record<string, string>) => void;
  setPrice: (price: string) => void;
  setPhone: (phone: string) => void;
  setCurrency: (currency: string) => void;
  setExteriorColor: (value: string) => void;
  setInteriorColor: (value: string) => void;
  setWarranty: (value: string) => void;
  setFuelType: (value: string) => void;
  setInsuredInUae: (value: string) => void;
  setLocateYourItem: (value: string) => void;
  setLocationAddress: (value: string) => void;
  setLocationCoordinates: (latitude: number, longitude: number) => void;
  reset: () => void;
  getDraft: () => EditProductDraft;
}

export const useEditProductStore = create<EditProductStore>()(
  persist(
    (set, get) => ({
      ...emptyDraft(),
      isHydrated: false,
      setProductId: productId => set({ productId }),
      initFromDraft: draft =>
        set({
          ...emptyDraft(),
          ...draft,
          isHydrated: true,
          removedRemoteImagePaths: draft.removedRemoteImagePaths ?? [],
        }),
      setCategory: (id, name) => {
        const { categoryId } = resolveProductCategoryIds({
          categoryId: id,
          subcategoryId: undefined,
          dynamicFormCategoryId: undefined,
        });
        set({
          categoryId,
          categoryName: name,
          subcategoryId: undefined,
          subcategoryName: undefined,
          dynamicFormCategoryId: undefined,
        });
      },
      setSubcategory: (id, name) => {
        const state = get();
        const { categoryId, subcategoryId } = resolveProductCategoryIds({
          categoryId: state.categoryId,
          subcategoryId: id,
          dynamicFormCategoryId: resolveDynamicFormCategoryId(id, state.categoryId),
        });
        set({
          subcategoryId,
          subcategoryName: name,
          categoryId,
          dynamicFormCategoryId: resolveDynamicFormCategoryId(subcategoryId, categoryId),
        });
      },
      setPropertySubcategory: (parentId, subcategoryId, name) => {
        const { categoryId, subcategoryId: resolvedSubcategoryId } = resolveProductCategoryIds({
          categoryId: parentId,
          subcategoryId,
          dynamicFormCategoryId: resolveDynamicFormCategoryId(subcategoryId, parentId),
        });
        set({
          categoryId,
          subcategoryId: resolvedSubcategoryId,
          subcategoryName: name,
          dynamicFormCategoryId: resolveDynamicFormCategoryId(resolvedSubcategoryId, categoryId),
        });
      },
      setCategoryPath: categoryPath => set({ categoryPath }),
      setVideo: video => set({ video }),
      setRemoteVideoUrl: remoteVideoUrl => set({ remoteVideoUrl }),
      setImages: images => set({ images }),
      addImages: images =>
        set(state => ({
          images: [...state.images, ...images].slice(0, 10),
        })),
      removeImage: id =>
        set(state => {
          const target = state.images.find(img => img.id === id);
          const removedRemoteImagePaths =
            target?.isRemote && target.remotePath
              ? [...(state.removedRemoteImagePaths ?? []), target.remotePath]
              : state.removedRemoteImagePaths;
          return {
            images: state.images.filter(img => img.id !== id),
            removedRemoteImagePaths,
          };
        }),
      replaceImage: (id, updates) =>
        set(state => {
          const targetIndex = state.images.findIndex(img => img.id === id);
          if (targetIndex < 0) {
            return state;
          }

          const target = state.images[targetIndex];
          let removedRemoteImagePaths = state.removedRemoteImagePaths;
          if (target.isRemote && target.remotePath && updates.uri) {
            removedRemoteImagePaths = [...(state.removedRemoteImagePaths ?? []), target.remotePath];
          }

          const nextImages = [...state.images];
          nextImages[targetIndex] = {
            ...target,
            ...updates,
            isRemote: false,
            remotePath: undefined,
          };

          return {
            removedRemoteImagePaths,
            images: nextImages,
          };
        }),
      updateImage: (id, updates) =>
        set(state => ({
          images: state.images.map(img => (img.id === id ? { ...img, ...updates } : img)),
        })),
      reorderImages: (from, to) =>
        set(state => {
          const next = [...state.images];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          return { images: next };
        }),
      setTitle: title => set({ title }),
      setDescription: description => set({ description }),
      setTranscript: transcript => set({ transcript }),
      setDynamicField: (key, value) =>
        set(state => ({ dynamicFields: { ...state.dynamicFields, [key]: value } })),
      setDynamicFields: dynamicFields => set({ dynamicFields }),
      setPrice: price => set({ price }),
      setPhone: phone => set({ phone }),
      setCurrency: currency => set({ currency }),
      setExteriorColor: exteriorColor => set({ exteriorColor }),
      setInteriorColor: interiorColor => set({ interiorColor }),
      setWarranty: warranty => set({ warranty }),
      setFuelType: fuelType => set({ fuelType }),
      setInsuredInUae: insuredInUae => set({ insuredInUae }),
      setLocateYourItem: locateYourItem => set({ locateYourItem }),
      setLocationAddress: locationAddress => set({ locationAddress }),
      setLocationCoordinates: (locationLatitude, locationLongitude) =>
        set({ locationLatitude, locationLongitude }),
      reset: () => set({ ...emptyDraft(), isHydrated: false }),
      getDraft: () => {
        const s = get();
        return {
          productId: s.productId,
          categoryId: s.categoryId,
          categoryName: s.categoryName,
          subcategoryId: s.subcategoryId,
          subcategoryName: s.subcategoryName,
          categoryPath: s.categoryPath,
          video: s.video,
          remoteVideoUrl: s.remoteVideoUrl,
          images: s.images,
          removedRemoteImagePaths: s.removedRemoteImagePaths,
          title: s.title,
          description: s.description,
          transcript: s.transcript,
          dynamicFields: s.dynamicFields,
          price: s.price,
          phone: s.phone,
          currency: s.currency,
          exteriorColor: s.exteriorColor,
          interiorColor: s.interiorColor,
          warranty: s.warranty,
          fuelType: s.fuelType,
          insuredInUae: s.insuredInUae,
          dynamicFormCategoryId: s.dynamicFormCategoryId,
          locateYourItem: s.locateYourItem,
          locationAddress: s.locationAddress,
          locationLatitude: s.locationLatitude,
          locationLongitude: s.locationLongitude,
        };
      },
    }),
    {
      name: EDIT_PRODUCT_DRAFT_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        productId: state.productId,
        categoryId: state.categoryId,
        categoryName: state.categoryName,
        subcategoryId: state.subcategoryId,
        subcategoryName: state.subcategoryName,
        categoryPath: state.categoryPath,
        dynamicFormCategoryId: state.dynamicFormCategoryId,
        video: state.video,
        remoteVideoUrl: state.remoteVideoUrl,
        images: state.images,
        removedRemoteImagePaths: state.removedRemoteImagePaths,
        title: state.title,
        description: state.description,
        transcript: state.transcript,
        dynamicFields: state.dynamicFields,
        price: state.price,
        phone: state.phone,
        currency: state.currency,
        exteriorColor: state.exteriorColor,
        interiorColor: state.interiorColor,
        warranty: state.warranty,
        fuelType: state.fuelType,
        insuredInUae: state.insuredInUae,
        locateYourItem: state.locateYourItem,
        locationAddress: state.locationAddress,
        locationLatitude: state.locationLatitude,
        locationLongitude: state.locationLongitude,
        isHydrated: state.isHydrated,
      }),
    },
  ),
);
