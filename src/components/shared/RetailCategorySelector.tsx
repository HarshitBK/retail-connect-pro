import React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RETAIL_CATEGORIES } from "@/lib/constants";
import { ShoppingBag } from "lucide-react";

interface RetailCategorySelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  maxCategories?: number;
  label?: string;
}

const RetailCategorySelector: React.FC<RetailCategorySelectorProps> = ({
  selectedCategories,
  onChange,
  maxCategories = 5,
  label = "Retail Specialization",
}) => {
  const toggleCategory = (value: string) => {
    if (selectedCategories.includes(value)) {
      onChange(selectedCategories.filter((c) => c !== value));
    } else {
      if (selectedCategories.length >= maxCategories) return;
      onChange([...selectedCategories, value]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <ShoppingBag className="w-4 h-4" />
        {label} (Select up to {maxCategories})
      </Label>

      {selectedCategories.length >= maxCategories && (
        <p className="text-sm text-warning">Maximum {maxCategories} categories selected</p>
      )}

      <div className="flex flex-wrap gap-2">
        {RETAIL_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.value);
          const isDisabled = !isSelected && selectedCategories.length >= maxCategories;

          return (
            <button
              key={category.value}
              type="button"
              onClick={() => toggleCategory(category.value)}
              disabled={isDisabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isDisabled
                  ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RetailCategorySelector;
