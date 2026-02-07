import { z } from "zod";

// Phone number validation (Indian format: +91 followed by 10 digits)
export const phoneSchema = z.string()
  .regex(/^(\+91)?[6-9]\d{9}$/, "Invalid phone number. Format: +91XXXXXXXXXX or 10 digits starting with 6-9");

export const phoneWithCodeSchema = z.string()
  .regex(/^\+91[6-9]\d{9}$/, "Phone must be in format +91XXXXXXXXXX");

// Email validation
export const emailSchema = z.string()
  .email("Invalid email address")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email must contain @ and .");

// PAN Card validation (Format: AAAAA9999A - 5 letters, 4 digits, 1 letter)
export const panSchema = z.string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format. Example: ABCDE1234F");

// Aadhar validation (12 digits)
export const aadharSchema = z.string()
  .regex(/^\d{12}$/, "Aadhar must be exactly 12 digits");

// GST Number validation (15 characters)
export const gstSchema = z.string()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST format. Example: 22AAAAA0000A1Z5");

// CIN Number validation (21 characters)
export const cinSchema = z.string()
  .regex(/^([LUu]{1})([0-9]{5})([A-Za-z]{2})([0-9]{4})([A-Za-z]{3})([0-9]{6})$/, "Invalid CIN format");

// IFSC Code validation
export const ifscSchema = z.string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code. Example: SBIN0001234");

// Pincode validation (6 digits)
export const pincodeSchema = z.string()
  .regex(/^\d{6}$/, "Pincode must be exactly 6 digits");

// Password validation
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Name validation
export const nameSchema = z.string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces");

// OTP validation
export const otpSchema = z.string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d{6}$/, "OTP must contain only digits");

// Employee registration schemas
export const employeePersonalSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], { required_error: "Gender is required" }),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: pincodeSchema,
  preferredWorkCities: z.array(z.object({
    state: z.string(),
    cities: z.array(z.string())
  })).optional(),
});

export const employeeProfessionalSchema = z.object({
  educationLevel: z.string().min(1, "Education level is required"),
  educationDetails: z.string().optional(),
  yearsOfExperience: z.number().min(0, "Experience cannot be negative"),
  currentOrganization: z.string().optional(),
  previousOrganizations: z.array(z.object({
    name: z.string(),
    role: z.string(),
    duration: z.string(),
    description: z.string().optional()
  })).optional(),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
});

export const employeeGovernmentSchema = z.object({
  aadharNumber: aadharSchema.optional().or(z.literal("")),
  panNumber: panSchema.optional().or(z.literal("")),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: ifscSchema.optional().or(z.literal("")),
});

// Employer registration schema
export const employerRegistrationSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  organizationType: z.string().min(1, "Organization type is required"),
  gstNumber: gstSchema.optional().or(z.literal("")),
  panNumber: panSchema.optional().or(z.literal("")),
  cinNumber: cinSchema.optional().or(z.literal("")),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: pincodeSchema,
  website: z.string().url().optional().or(z.literal("")),
  contactPersonName: nameSchema,
  contactPersonDesignation: z.string().min(1, "Designation is required"),
  contactPersonPhone: phoneSchema,
  contactPersonEmail: emailSchema,
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Signup schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Helper function to format phone number
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }
  return phone;
};

// Helper function to validate and format inputs
export const validateField = (schema: z.ZodSchema, value: unknown): { valid: boolean; error?: string } => {
  const result = schema.safeParse(value);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, error: result.error.errors[0]?.message };
};
