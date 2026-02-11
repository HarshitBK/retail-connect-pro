import React, { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { X, MapPin, Loader2, Search } from "lucide-react";

export interface SelectedCityItem {
  cityId: string;
  cityName: string;
  stateName: string;
}

interface CitySelectorProps {
  selectedCities: SelectedCityItem[];
  onChange: (cities: SelectedCityItem[]) => void;
  maxCities?: number;
  label?: string;
}

interface CityWithState {
  id: string;
  name: string;
  state_name: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  selectedCities,
  onChange,
  maxCities = 5,
  label = "Preferred Work Locations",
}) => {
  const [allCities, setAllCities] = useState<CityWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAllCities();
  }, []);

  const fetchAllCities = async () => {
    try {
      const { data: cities, error: citiesError } = await supabase
        .from("indian_cities")
        .select("id, name, state_id")
        .order("name");

      if (citiesError) throw citiesError;

      const { data: states, error: statesError } = await supabase
        .from("indian_states")
        .select("id, name")
        .order("name");

      if (statesError) throw statesError;

      const stateMap = new Map((states || []).map(s => [s.id, s.name]));

      setAllCities(
        (cities || []).map(c => ({
          id: c.id,
          name: c.name,
          state_name: stateMap.get(c.state_id) || "",
        }))
      );
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return allCities.slice(0, 50);
    const q = searchQuery.toLowerCase();
    return allCities
      .filter(c => c.name.toLowerCase().includes(q) || c.state_name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [allCities, searchQuery]);

  const toggleCity = (city: CityWithState) => {
    const exists = selectedCities.find(c => c.cityId === city.id);
    if (exists) {
      onChange(selectedCities.filter(c => c.cityId !== city.id));
    } else {
      if (selectedCities.length >= maxCities) return;
      onChange([...selectedCities, { cityId: city.id, cityName: city.name, stateName: city.state_name }]);
    }
  };

  const removeCity = (cityId: string) => {
    onChange(selectedCities.filter(c => c.cityId !== cityId));
  };

  const isCitySelected = (cityId: string) => selectedCities.some(c => c.cityId === cityId);

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {label} (Max {maxCities})
      </Label>

      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          {selectedCities.map(city => (
            <Badge key={city.cityId} variant="secondary" className="gap-1 py-1 px-2">
              {city.cityName}, {city.stateName}
              <button type="button" onClick={() => removeCity(city.cityId)} className="ml-1 hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selectedCities.length >= maxCities && (
        <p className="text-sm text-warning">Maximum {maxCities} cities selected</p>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search city or state..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="border rounded-lg p-2">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading cities...</span>
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                {filteredCities.map(city => {
                  const isSelected = isCitySelected(city.id);
                  const isDisabled = !isSelected && selectedCities.length >= maxCities;
                  return (
                    <div
                      key={city.id}
                      className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
                        isSelected ? "bg-primary/10" : isDisabled ? "opacity-50" : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        id={`city-${city.id}`}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => toggleCity(city)}
                      />
                      <label
                        htmlFor={`city-${city.id}`}
                        className={`text-xs cursor-pointer flex-1 ${isDisabled ? "cursor-not-allowed" : ""}`}
                      >
                        {city.name}
                        <span className="text-muted-foreground block text-[10px]">{city.state_name}</span>
                      </label>
                    </div>
                  );
                })}
                {filteredCities.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 col-span-3">
                    {searchQuery ? "No cities found" : "Type to search cities"}
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitySelector;
