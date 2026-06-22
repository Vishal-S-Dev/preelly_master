import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CREATE_POST_DRAFT_KEY } from '../constants/createPostConstants';
import {
  AiListingExtraction,
  CreatePostDraft,
  CreatePostImageAsset,
  CreatePostMediaFile,
  SuggestedFilters,
  TranscriptExtractedData,
} from '../types/createPost.types';
import { resolveDynamicFormCategoryId } from '../utils/resolveDynamicFormCategoryId';
import { resolveProductCategoryIds } from '../utils/resolveProductCategoryIds';

const emptyDraft = (): CreatePostDraft => ({
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
});

interface CreatePostStore extends CreatePostDraft {
  setCategory: (id: string, name: string) => void;
  setSubcategory: (id: string, name: string) => void;
  setPropertySubcategory: (parentId: string, subcategoryId: string, name: string) => void;
  setVideo: (video: CreatePostMediaFile | null) => void;
  setImages: (images: CreatePostImageAsset[]) => void;
  addImages: (images: CreatePostImageAsset[]) => void;
  removeImage: (id: string) => void;
  replaceImage: (id: string, updates: Partial<Omit<CreatePostImageAsset, 'id'>>) => void;
  updateImage: (id: string, updates: Partial<Pick<CreatePostImageAsset, 'caption' | 'order'>>) => void;
  reorderImages: (from: number, to: number) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setTranscript: (transcript: string) => void;
  setExtractedData: (data: TranscriptExtractedData | null) => void;
  setSuggestedFilters: (filters: SuggestedFilters | null) => void;
  setAiExtraction: (data: AiListingExtraction | null) => void;
  setDynamicField: (key: string, value: string) => void;
  setDynamicFields: (fields: Record<string, string>) => void;
  setPrice: (price: string) => void;
  setPhone: (phone: string) => void;
  setExteriorColor: (value: string) => void;
  setInteriorColor: (value: string) => void;
  setWarranty: (value: string) => void;
  setFuelType: (value: string) => void;
  setInsuredInUae: (value: string) => void;
  setLocateYourItem: (value: string) => void;
  setLocationAddress: (value: string) => void;
  setLocationCoordinates: (latitude: number, longitude: number) => void;
  applyExtractionToFields: () => void;
  reset: () => void;
  getDraft: () => CreatePostDraft;
}

export const useCreatePostStore = create<CreatePostStore>()(
  persist(
    (set, get) => ({
      ...emptyDraft(),
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
      setVideo: video => set({ video }),
      setImages: images => set({ images }),
      addImages: images =>
        set(state => ({
          images: [...state.images, ...images].slice(0, 10),
        })),
      removeImage: id =>
        set(state => ({ images: state.images.filter(img => img.id !== id) })),
      replaceImage: (id, updates) =>
        set(state => ({
          images: state.images.map(img => (img.id === id ? { ...img, ...updates } : img)),
        })),
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
      setExtractedData: extractedData => set({ extractedData }),
      setSuggestedFilters: suggestedFilters => set({ suggestedFilters }),
      setAiExtraction: aiExtraction => set({ aiExtraction }),
      setDynamicField: (key, value) =>
        set(state => ({ dynamicFields: { ...state.dynamicFields, [key]: value } })),
      setDynamicFields: dynamicFields => set({ dynamicFields }),
      setPrice: price => set({ price }),
      setPhone: phone => set({ phone }),
      setExteriorColor: exteriorColor => set({ exteriorColor }),
      setInteriorColor: interiorColor => set({ interiorColor }),
      setWarranty: warranty => set({ warranty }),
      setFuelType: fuelType => set({ fuelType }),
      setInsuredInUae: insuredInUae => set({ insuredInUae }),
      setLocateYourItem: locateYourItem => set({ locateYourItem }),
      setLocationAddress: locationAddress => set({ locationAddress }),
      setLocationCoordinates: (locationLatitude, locationLongitude) =>
        set({ locationLatitude, locationLongitude }),
      applyExtractionToFields: () => {
        const state = get();
        const data = state.extractedData;
        const ai = state.aiExtraction;
        const nextFields = { ...state.dynamicFields };

        if (data?.year) {
          nextFields.year = String(data.year);
        }
        if (data?.make || data?.model) {
          nextFields.makeModel = [data.make, data.model].filter(Boolean).join(' ').trim();
        }
        if (data?.regionalSpecs) {
          nextFields.regionalSpecs = String(data.regionalSpecs);
        }
        if (data?.mileage) {
          nextFields.kilometers = String(data.mileage);
        }
        if (data?.bodyType) {
          nextFields.bodyType = String(data.bodyType);
        }
        if (data?.fuelType) {
          nextFields.fuelType = String(data.fuelType);
        }
        if (data?.trim) {
          nextFields.trim = String(data.trim);
        }
        if (data?.city || data?.area) {
          const cityName = String(data.city ?? data.area);
          nextFields.cityid = cityName;
        }

        const selections = state.suggestedFilters?.selections ?? {};
        Object.entries(selections).forEach(([key, value]) => {
          const normalized = key.replace(/^filter_/, '');
          if (value) {
            nextFields[normalized] = String(value);
          }
        });

        const aiFilter = ai?.filter_data ?? {};
        Object.entries(aiFilter).forEach(([key, value]) => {
          if (value != null && value !== '') {
            nextFields[key] = String(value);
          }
        });

        set({
          title: state.title || (data?.title ? String(data.title) : ''),
          description: state.description || (data?.description ? String(data.description) : ''),
          price: state.price || (data?.price ? String(data.price) : ''),
          dynamicFields: nextFields,
          exteriorColor: state.exteriorColor || String(nextFields.exteriorColor ?? ''),
          interiorColor: state.interiorColor || String(nextFields.interiorColor ?? ''),
          warranty: state.warranty || String(nextFields.warranty ?? ''),
          fuelType: state.fuelType || String(nextFields.fuelType ?? ''),
        });
      },
      reset: () => set(emptyDraft()),
      getDraft: () => {
        const s = get();
        return {
          categoryId: s.categoryId,
          categoryName: s.categoryName,
          subcategoryId: s.subcategoryId,
          subcategoryName: s.subcategoryName,
          video: s.video,
          images: s.images,
          title: s.title,
          description: s.description,
          transcript: s.transcript,
          extractedData: s.extractedData,
          suggestedFilters: s.suggestedFilters,
          aiExtraction: s.aiExtraction,
          dynamicFields: s.dynamicFields,
          price: s.price,
          phone: s.phone,
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
      name: CREATE_POST_DRAFT_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        categoryId: state.categoryId,
        categoryName: state.categoryName,
        subcategoryId: state.subcategoryId,
        subcategoryName: state.subcategoryName,
        dynamicFormCategoryId: state.dynamicFormCategoryId,
        video: state.video,
        images: state.images,
        title: state.title,
        description: state.description,
        transcript: state.transcript,
        extractedData: state.extractedData,
        suggestedFilters: state.suggestedFilters,
        aiExtraction: state.aiExtraction,
        dynamicFields: state.dynamicFields,
        price: state.price,
        phone: state.phone,
        exteriorColor: state.exteriorColor,
        interiorColor: state.interiorColor,
        warranty: state.warranty,
        fuelType: state.fuelType,
        insuredInUae: state.insuredInUae,
        locateYourItem: state.locateYourItem,
        locationAddress: state.locationAddress,
        locationLatitude: state.locationLatitude,
        locationLongitude: state.locationLongitude,
      }),
    },
  ),
);
