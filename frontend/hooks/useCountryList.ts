// hooks/useCountryList.ts
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export interface CountryCode {
  country: string;
  code: string;
  iso: string;
}

export function useCountryList(defaultIso: string = "US") {
  const [countries, setCountries] = useState<CountryCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchCountries() {
      try {
        setIsLoading(true);
        const response = await axios.get<CountryCode[]>(
          "https://api.npoint.io/900fa8cc45c942a0c38e"
        );
        if (!isMounted) return;

        setCountries(response.data);

        // Pick default (if found), otherwise first in list
        const defaultCountry =
          response.data.find((c) => c.iso === defaultIso) || response.data[0];
        setSelectedCountry(defaultCountry);
      } catch (err) {
        console.error("Error fetching country data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchCountries();
    return () => {
      isMounted = false;
    };
  }, [defaultIso]);

  return { countries, isLoading, selectedCountry, setSelectedCountry };
}
