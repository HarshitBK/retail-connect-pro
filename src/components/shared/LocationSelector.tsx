import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useIndianLocations } from "@/hooks/useIndianLocations";
import { X, MapPin, Check } from "lucide-react";

interface WorkLocation {
  stateId: string;
  stateName: string;
  cities: string[];
  allCitiesSelected: boolean;
}

interface LocationSelectorProps {
  selectedLocations: WorkLocation[];
  onChange: (locations: WorkLocation[]) => void;
  mode?: "single" | "multiple";
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocations,
  onChange,
  mode = "multiple",
}) => {
  const { states, loadingStates, fetchCitiesByState } = useIndianLocations();
  const [currentState, setCurrentState] = useState<string>("");
  const [stateCities, setStateCities] = useState<{ id: string; name: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const handleStateSelect = async (stateId: string) => {
    setCurrentState(stateId);
    setLoadingCities(true);
    const cities = await fetchCitiesByState(stateId);
    setStateCities(cities.map(c => ({ id: c.id, name: c.name })));
    setLoadingCities(false);
  };

  const handleSelectAllCities = () => {
    if (!currentState) return;
    
    const state = states.find(s => s.id === currentState);
    if (!state) return;

    const existingIndex = selectedLocations.findIndex(l => l.stateId === currentState);
    
    if (existingIndex >= 0) {
      // Toggle: if all selected, remove; otherwise select all
      const existing = selectedLocations[existingIndex];
      if (existing.allCitiesSelected) {
        const newLocations = selectedLocations.filter(l => l.stateId !== currentState);
        onChange(newLocations);
      } else {
        const newLocations = [...selectedLocations];
        newLocations[existingIndex] = {
          stateId: currentState,
          stateName: state.name,
          cities: stateCities.map(c => c.name),
          allCitiesSelected: true,
        };
        onChange(newLocations);
      }
    } else {
      onChange([
        ...selectedLocations,
        {
          stateId: currentState,
          stateName: state.name,
          cities: stateCities.map(c => c.name),
          allCitiesSelected: true,
        },
      ]);
    }
  };

  const handleCityToggle = (cityName: string) => {
    if (!currentState) return;
    
    const state = states.find(s => s.id === currentState);
    if (!state) return;

    const existingIndex = selectedLocations.findIndex(l => l.stateId === currentState);
    
    if (existingIndex >= 0) {
      const existing = selectedLocations[existingIndex];
      const cityExists = existing.cities.includes(cityName);
      
      let newCities: string[];
      if (cityExists) {
        newCities = existing.cities.filter(c => c !== cityName);
      } else {
        newCities = [...existing.cities, cityName];
      }
      
      if (newCities.length === 0) {
        const newLocations = selectedLocations.filter(l => l.stateId !== currentState);
        onChange(newLocations);
      } else {
        const newLocations = [...selectedLocations];
        newLocations[existingIndex] = {
          ...existing,
          cities: newCities,
          allCitiesSelected: newCities.length === stateCities.length,
        };
        onChange(newLocations);
      }
    } else {
      onChange([
        ...selectedLocations,
        {
          stateId: currentState,
          stateName: state.name,
          cities: [cityName],
          allCitiesSelected: false,
        },
      ]);
    }
  };

  const removeLocation = (stateId: string, cityName?: string) => {
    if (cityName) {
      const existingIndex = selectedLocations.findIndex(l => l.stateId === stateId);
      if (existingIndex >= 0) {
        const existing = selectedLocations[existingIndex];
        const newCities = existing.cities.filter(c => c !== cityName);
        if (newCities.length === 0) {
          onChange(selectedLocations.filter(l => l.stateId !== stateId));
        } else {
          const newLocations = [...selectedLocations];
          newLocations[existingIndex] = {
            ...existing,
            cities: newCities,
            allCitiesSelected: false,
          };
          onChange(newLocations);
        }
      }
    } else {
      onChange(selectedLocations.filter(l => l.stateId !== stateId));
    }
  };

  const currentStateLocation = selectedLocations.find(l => l.stateId === currentState);

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Preferred Work Locations
      </Label>

      {/* Selected Locations Display */}
      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          {selectedLocations.map((location) => (
            <div key={location.stateId} className="space-y-1">
              {location.allCitiesSelected ? (
                <Badge variant="secondary" className="gap-1">
                  All of {location.stateName}
                  <button
                    type="button"
                    onClick={() => removeLocation(location.stateId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ) : (
                location.cities.map((city) => (
                  <Badge key={city} variant="outline" className="gap-1 mr-1">
                    {city}, {location.stateName}
                    <button
                      type="button"
                      onClick={() => removeLocation(location.stateId, city)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* State Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Select State</Label>
          <Select value={currentState} onValueChange={handleStateSelect}>
            <SelectTrigger>
              <SelectValue placeholder={loadingStates ? "Loading..." : "Choose a state"} />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentState && (
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Select Cities</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllCities}
              className="w-full"
            >
              {currentStateLocation?.allCitiesSelected ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Select All Cities
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* City Selection */}
      {currentState && (
        <div className="border rounded-lg p-4">
          {loadingCities ? (
            <p className="text-muted-foreground text-sm">Loading cities...</p>
          ) : stateCities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No cities found for this state</p>
          ) : (
            <ScrollArea className="h-48">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {stateCities.map((city) => {
                  const isSelected = currentStateLocation?.cities.includes(city.name) || false;
                  return (
                    <div key={city.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={city.id}
                        checked={isSelected}
                        onCheckedChange={() => handleCityToggle(city.name)}
                      />
                      <label
                        htmlFor={city.id}
                        className="text-sm cursor-pointer"
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
      )}
    </div>
  );
};

export default LocationSelector;
