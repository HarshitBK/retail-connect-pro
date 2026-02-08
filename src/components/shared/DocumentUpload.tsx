import React, { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Check } from "lucide-react";

interface DocumentUploadProps {
  label: string;
  accept?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  helpText?: string;
  required?: boolean;
  existingUrl?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  accept = ".pdf,.jpg,.jpeg,.png",
  value,
  onChange,
  helpText,
  required = false,
  existingUrl,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const hasFile = value || existingUrl;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {hasFile ? (
        <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {value ? value.name : "Document uploaded"}
              </p>
              {value && (
                <p className="text-xs text-muted-foreground">
                  {(value.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClick}>
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">Click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">
            {helpText || "PDF, JPG, PNG (Max 5MB)"}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
