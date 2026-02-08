// Retail categories for employee specialization and employer filtering
export const RETAIL_CATEGORIES = [
  { value: "apparels", label: "Apparels & Fashion" },
  { value: "shoes", label: "Shoes & Footwear" },
  { value: "jewellery", label: "Jewellery" },
  { value: "health_beauty", label: "Health & Beauty" },
  { value: "pharma", label: "Pharma" },
  { value: "eyewear", label: "Eyewear" },
  { value: "wristwear", label: "Wristwear & Watches" },
  { value: "grocery", label: "Grocery & Supermarket" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "electronics", label: "Electronics" },
  { value: "perfumes", label: "Perfumes & Cosmetics" },
  { value: "furniture", label: "Furniture & Home Decor" },
  { value: "toys", label: "Toys & Games" },
  { value: "books", label: "Books & Stationery" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "mobile", label: "Mobile & Accessories" },
  { value: "other", label: "Other Retail" },
] as const;

// Skill options for employees
export const SKILL_OPTIONS = [
  "Cash Handling",
  "Customer Service", 
  "Inventory Management",
  "POS Systems",
  "Sales",
  "Visual Merchandising",
  "Stock Management",
  "Team Leadership",
  "Communication",
  "Problem Solving",
  "Time Management",
  "Computer Skills",
  "Billing Software",
  "Product Knowledge",
  "Upselling",
  "CRM",
] as const;

// Education levels
export const EDUCATION_LEVELS = [
  { value: "10th", label: "10th Pass" },
  { value: "12th", label: "12th Pass" },
  { value: "graduate", label: "Graduate" },
  { value: "postgraduate", label: "Post Graduate" },
  { value: "diploma", label: "Diploma" },
  { value: "iti", label: "ITI" },
] as const;

// Experience levels
export const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher" },
  { value: "0-1", label: "0-1 Years" },
  { value: "1-2", label: "1-2 Years" },
  { value: "2-5", label: "2-5 Years" },
  { value: "5-10", label: "5-10 Years" },
  { value: "10+", label: "10+ Years" },
] as const;

// Company types
export const COMPANY_TYPES = [
  { value: "pvt", label: "Private Limited" },
  { value: "llp", label: "LLP" },
  { value: "partnership", label: "Partnership" },
  { value: "proprietorship", label: "Proprietorship" },
  { value: "public", label: "Public Limited" },
] as const;

// Company sizes
export const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
] as const;

// Industry types
export const INDUSTRY_TYPES = [
  { value: "retail", label: "Retail Store" },
  { value: "supermarket", label: "Supermarket/Hypermarket" },
  { value: "mall", label: "Shopping Mall" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "warehouse", label: "Warehouse/Logistics" },
  { value: "hospitality", label: "Hospitality" },
  { value: "franchise", label: "Franchise" },
  { value: "other", label: "Other" },
] as const;

// Social share messages
export const SHARE_MESSAGES = {
  employee: {
    title: "I'm available for retail jobs on RetailHire! 🛍️",
    text: "I just registered on RetailHire - India's #1 retail job portal. Looking for my next opportunity in the retail industry. If you know of any openings, please share!",
    hashtags: ["RetailHire", "RetailJobs", "JobSearch", "Hiring", "Retail"],
  },
  employer: {
    title: "We're Hiring on RetailHire! 🎯",
    text: "We are actively hiring through RetailHire - India's #1 retail hiring platform. If you or someone you know is looking for opportunities in retail, register now and take our skill tests!",
    hashtags: ["RetailHire", "NowHiring", "RetailJobs", "JobOpening", "Careers"],
  },
} as const;
