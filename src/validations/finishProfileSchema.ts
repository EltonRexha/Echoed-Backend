import { subYears } from 'date-fns';
import { z } from 'zod';
import { countries } from 'countries-list';

const COUNTRIES = Object.values(countries)
  .map((country) => country.name)
  .sort();

const finishProfileSchema = z.object({
  firstName: z
    .string()
    .min(3, 'At least 3 characters')
    .max(10, 'Reached max of characters (10)')
    .regex(/^[A-Za-z]+$/, 'Only letters are allowed'),
  lastName: z
    .string()
    .min(3, 'At least 3 characters')
    .max(10, 'Reached max of characters (10)')
    .regex(/^[A-Za-z]+$/, 'Only letters are allowed'),
  username: z
    .string()
    .min(3, 'The username must have at least 3 characters')
    .max(20, 'Reached max of characters'),
  country: z.enum(COUNTRIES as [string, ...string[]]),
  dateOfBirth: z.date().refine((dob) => dob <= subYears(new Date(), 13), {
    message: 'User must be at least 13 years old',
  }),
});

export default finishProfileSchema;
