import { z } from 'zod';
import { parseDobDisplayToDate } from '../profileEditUtils';

const MIN_AGE = 13;

export const profileCompletionSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required'),
  lastName: z.string().trim().min(2, 'Last name is required'),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date of birth is required')
    .refine(value => {
      const date = parseDobDisplayToDate(value);
      if (!date) {
        return false;
      }
      const today = new Date();
      if (date > today) {
        return false;
      }
      const age =
        today.getFullYear() -
        date.getFullYear() -
        (today < new Date(today.getFullYear(), date.getMonth(), date.getDate()) ? 1 : 0);
      return age >= MIN_AGE;
    }, `You must be at least ${MIN_AGE} years old`),
  nationality: z.string().trim().optional(),
  gender: z
    .enum(['male', 'female', 'prefer_not_to_say'])
    .refine(value => value === 'male' || value === 'female', {
      message: 'Please select gender',
    }),
});
