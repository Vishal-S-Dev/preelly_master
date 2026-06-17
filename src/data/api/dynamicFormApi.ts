import { API_ENDPOINTS } from '../../constants/appConstants';
import { ENV } from '../../constants/env';
import { DynamicFormData, DynamicFormResponse } from '../../types/dynamicForm.types';
import { normalizeDynamicFormData } from '../../utils/dynamicFormUtils';
import { isMongoObjectId } from '../../utils/mongoId';
import { httpClient } from './httpClient';

const WEB_API_BASE = ENV.WEB_API_BASE_URL;

export const DynamicFormApi = {
  async getByCategoryId(categoryId: string): Promise<DynamicFormData> {
    const trimmedId = categoryId.trim();
    if (!trimmedId) {
      throw new Error('Category id is required');
    }
    if (!isMongoObjectId(trimmedId)) {
      throw new Error('categoryId must be a valid MongoDB ObjectId');
    }

    try {
      const { data } = await httpClient.post<DynamicFormResponse>(
        API_ENDPOINTS.DYNAMIC_FORM,
        { categoryId: trimmedId },
        {
          baseURL: WEB_API_BASE,
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const hasWrappedPayload = Boolean(data?.data?.steps?.length);
      const hasDirectPayload = Boolean(data?.steps?.length);

      if (!hasWrappedPayload && !hasDirectPayload) {
        throw new Error(data?.message ?? 'Failed to fetch dynamic form');
      }

      return normalizeDynamicFormData(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch dynamic form';
      throw new Error(message);
    }
  },
};
