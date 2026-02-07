import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface State {
  id: string;
  name: string;
  code: string;
}

interface City {
  id: string;
  stateId: string;
  name: string;
}

export const useIndianLocations = () => {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const { data, error } = await supabase
        .from("indian_states")
        .select("*")
        .order("name");

      if (error) throw error;

      setStates(
        (data || []).map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
        }))
      );
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCitiesByState = async (stateId: string) => {
    setLoadingCities(true);
    try {
      const { data, error } = await supabase
        .from("indian_cities")
        .select("*")
        .eq("state_id", stateId)
        .order("name");

      if (error) throw error;

      const citiesData = (data || []).map((c) => ({
        id: c.id,
        stateId: c.state_id,
        name: c.name,
      }));

      setCities(citiesData);
      return citiesData;
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    } finally {
      setLoadingCities(false);
    }
  };

  const getCitiesForStates = async (stateIds: string[]): Promise<City[]> => {
    if (stateIds.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from("indian_cities")
        .select("*")
        .in("state_id", stateIds)
        .order("name");

      if (error) throw error;

      return (data || []).map((c) => ({
        id: c.id,
        stateId: c.state_id,
        name: c.name,
      }));
    } catch (error) {
      console.error("Error fetching cities for states:", error);
      return [];
    }
  };

  return {
    states,
    cities,
    loadingStates,
    loadingCities,
    fetchCitiesByState,
    getCitiesForStates,
  };
};
