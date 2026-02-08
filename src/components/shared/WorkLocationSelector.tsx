import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIndianLocations } from "@/hooks/useIndianLocations";
import { X, MapPin, Loader2 } from "lucide-react";

export interface SelectedCity {
  stateId: string;
  stateName: string;
  cityId: string;
  cityName: string;
}

interface WorkLocationSelectorProps {
  selectedCities: SelectedCity[];
  onChange: (cities: SelectedCity[]) => void;
  maxCities?: number;
  label?: string;
}

const WorkLocationSelector: React.FC<WorkLocationSelectorProps> = ({
  selectedCities,
  onChange,
  maxCities = 5,
  label = "Preferred Work Locations",
}) => {
  const { states, loadingStates, fetchCitiesByState } = useIndianLocations();
  const [currentStateId, setCurrentStateId] = useState<string>("");
  const [currentStateName, setCurrentStateName] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<{ id: string; name: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const handleStateChange = async (stateId: string) => {
    const state = states.find((s) => s.id === stateId);
    if (!state) return;

    setCurrentStateId(stateId);
    setCurrentStateName(state.name);
    setLoadingCities(true);

    const cities = await fetchCitiesByState(stateId);
    setAvailableCities(cities.map((c) => ({ id: c.id, name: c.name })));
    setLoadingCities(false);
  };

  const toggleCity = (cityId: string, cityName: string) => {
    const exists = selectedCities.find((c) => c.cityId === cityId);

    if (exists) {
      onChange(selectedCities.filter((c) => c.cityId !== cityId));
    } else {
      if (selectedCities.length >= maxCities) {
        return; // Max limit reached
      }
      onChange([
        ...selectedCities,
        {
          stateId: currentStateId,
          stateName: currentStateName,
          cityId,
          cityName,
        },
      ]);
    }
  };

  const removeCity = (cityId: string) => {
    onChange(selectedCities.filter((c) => c.cityId !== cityId));
  };

  const isCitySelected = (cityId: string) => {
    return selectedCities.some((c) => c.cityId === cityId);
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {label} (Max {maxCities})
      </Label>

      {/* Selected Cities Display */}
      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          {selectedCities.map((city) => (
            <Badge key={city.cityId} variant="secondary" className="gap-1 py-1 px-2">
              {city.cityName}, {city.stateName}
              <button
                type="button"
                onClick={() => removeCity(city.cityId)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selectedCities.length >= maxCities && (
        <p className="text-sm text-warning">Maximum {maxCities} cities can be selected</p>
      )}

      {/* State Selection */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Select State</Label>
        <Select value={currentStateId} onValueChange={handleStateChange}>
          <SelectTrigger>
            <SelectValue placeholder={loadingStates ? "Loading states..." : "Choose a state"} />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-60">
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {/* City Selection */}
      {currentStateId && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Select Cities in {currentStateName}</Label>
          <div className="border rounded-lg p-4">
            {loadingCities ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading cities...</span>
              </div>
            ) : availableCities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No cities found for this state
              </p>
            ) : (
              <ScrollArea className="h-48">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableCities.map((city) => {
                    const isSelected = isCitySelected(city.id);
                    const isDisabled = !isSelected && selectedCities.length >= maxCities;

                    return (
                      <div
                        key={city.id}
                        className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
                          isSelected
                            ? "bg-primary/10"
                            : isDisabled
                            ? "opacity-50"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Checkbox
                          id={city.id}
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={() => toggleCity(city.id, city.name)}
                        />
                        <label
                          htmlFor={city.id}
                          className={`text-sm cursor-pointer flex-1 ${
                            isDisabled ? "cursor-not-allowed" : ""
                          }`}
                        >
                          {city.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkLocationSelector;
