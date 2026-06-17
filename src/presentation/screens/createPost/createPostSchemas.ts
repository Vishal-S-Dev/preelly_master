import { z } from 'zod';

export const mediaStepSchema = z.object({
  videoUri: z.string().min(1, 'Video is required'),
});

export const detailsStepSchema = z.object({
  title: z.string().trim().min(3, 'Title is required'),
  description: z.string().trim().min(10, 'Description is required'),
});

export const summaryStepSchema = z.object({
  price: z.string().trim().min(1, 'Price is required'),
  phone: z.string().trim().min(7, 'Phone number is required'),
});

export type MediaStepValues = z.infer<typeof mediaStepSchema>;
export type DetailsStepValues = z.infer<typeof detailsStepSchema>;
export type SummaryStepValues = z.infer<typeof summaryStepSchema>;
