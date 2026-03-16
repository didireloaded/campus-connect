import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { marketplaceService, ListingWithSeller } from "@/services/marketplaceService";

export const useMarketplace = (category?: string) => {
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await marketplaceService.fetchListings(category);
      setListings(data);
    } catch (e) {
      console.error("Failed to fetch listings:", e);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("marketplace-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_listings" }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { listings, loading, refresh };
};
