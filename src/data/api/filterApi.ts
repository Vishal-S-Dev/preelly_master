import { API_ENDPOINTS } from '../../constants/appConstants';
import { ENV } from '../../constants/env';
import { DynamicFilterField, EmiratesItem } from '../../types/categoryFilter.types';
import { FormField, FormFieldOption } from '../../types/dynamicForm.types';
import { httpClient } from './httpClient';

const WEB_API_BASE = ENV.WEB_API_BASE_URL;

interface ApiListResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface WebFilterValue {
  id: string;
  name: string;
}

interface WebFilterItem {
  filterId: string;
  filterName: string;
  slug: string;
  values?: WebFilterValue[];
}

interface WebFiltersPayload {
  categoryId?: string;
  filters?: WebFilterItem[];
}

const mapWebFilterToDynamic = (filter: WebFilterItem): DynamicFilterField => {
  const title = filter.filterName.toLowerCase();
  return {
    id: filter.filterId,
    fieldKey: filter.slug,
    fieldTitle: filter.filterName,
    fieldType: title.includes('color') ? 'color' : 'multi_select',
    options: (filter.values ?? []).map(value => ({
      value: value.id,
      label: value.name,
    })),
  };
};

const normalizeEmirates = (payload: EmiratesItem[] | ApiListResponse<EmiratesItem[]>): EmiratesItem[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
};

const mapFormFieldType = (field: FormField): DynamicFilterField['fieldType'] => {
  const title = field.fieldTitle.toLowerCase();
  if (title.includes('color')) {
    return 'color';
  }
  if (field.fieldType === 'Dropdown') {
    return 'dropdown';
  }
  if (field.fieldType === 'Radio') {
    return 'single_select';
  }
  if (field.fieldType === 'Checkbox') {
    return 'multi_select';
  }
  return 'text';
};

const mapFormFieldToFilter = (field: FormField): DynamicFilterField => ({
  id: field.id,
  fieldKey: field.fieldName || field.id,
  fieldTitle: field.fieldTitle,
  fieldType: mapFormFieldType(field),
  options: (field.options ?? []).map((option: FormFieldOption) => ({
    value: option.value,
    label: option.label,
    color: option.slug,
  })),
});

const normalizeDynamicFilters = (
  payload:
    | DynamicFilterField[]
    | FormField[]
    | WebFiltersPayload
    | ApiListResponse<DynamicFilterField[] | FormField[] | WebFiltersPayload>,
): DynamicFilterField[] => {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return [];
    }
    const first = payload[0] as FormField | DynamicFilterField;
    if ('fieldTitle' in first && 'fieldType' in first && typeof first.fieldType === 'string') {
      if (first.fieldType === 'Dropdown' || first.fieldType === 'Checkbox' || first.fieldType === 'Radio') {
        return (payload as FormField[]).map(mapFormFieldToFilter);
      }
    }
    return payload as DynamicFilterField[];
  }

  if (payload && typeof payload === 'object') {
    if ('filters' in payload && Array.isArray(payload.filters)) {
      return payload.filters.map(mapWebFilterToDynamic);
    }

    if ('data' in payload && payload.data != null) {
      return normalizeDynamicFilters(payload.data);
    }
  }

  return [];
};

export const FilterApi = {
  async getEmirates(): Promise<EmiratesItem[]> {
    const { data } = await httpClient.get<EmiratesItem[] | ApiListResponse<EmiratesItem[]>>(
      API_ENDPOINTS.EMIRATES,
      { baseURL: WEB_API_BASE },
    );
    return normalizeEmirates(data);
  },

  async getDynamicFilters(subcategoryId: string): Promise<DynamicFilterField[]> {
    const { data } = await httpClient.get<
      DynamicFilterField[] | FormField[] | ApiListResponse<DynamicFilterField[] | FormField[]>
    >(`${API_ENDPOINTS.WEB_FILTERS}/${subcategoryId}`, { baseURL: WEB_API_BASE });
    return normalizeDynamicFilters(data);
  },
};
