import { subYears } from 'date-fns';
import { z } from 'zod';
import { countries } from 'countries-list';

const COUNTRIES = Object.values(countries)
  .map((country) => country.name)
  .sort();

const userSchema = z.object({
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
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[\W_]/, 'Password must contain at least one special character')
    .regex(/^\S*$/, 'Password cannot contain spaces')
    .regex(
      /^[A-Za-z0-9!@#$%^&*(),.?":{}|<>]*$/,
      'Password contains invalid characters'
    ),
  country: z.enum(COUNTRIES as [string, ...string[]]),
  gender: z.enum(['male', 'female', 'other', 'unkown']),
  dateOfBirth: z.date().refine((dob) => dob <= subYears(new Date(), 13), {
    message: 'User must be at least 13 years old',
  }),
});

export default userSchema;
