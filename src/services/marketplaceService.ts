import { supabase } from "@/integrations/supabase/client";

export interface ListingRow {
  id: string;
  seller_id: string;
  university_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  status: string;
  created_at: string;
}

export interface ListingWithSeller extends ListingRow {
  profiles: { username: string; avatar_url: string | null };
}

const CATEGORIES = ["textbooks", "electronics", "furniture", "clothing", "services", "roommate", "other"] as const;
export type ListingCategory = (typeof CATEGORIES)[number];
export { CATEGORIES };

export const marketplaceService = {
  async fetchListings(category?: string, limit = 50) {
    let query = supabase
      .from("marketplace_listings" as any)
      .select("*, profiles(username, avatar_url)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as ListingWithSeller[];
  },

  async createListing(params: {
    sellerId: string;
    universityId: string;
    title: string;
    description?: string;
    price: number;
    category: string;
    imageUrl?: string;
  }) {
    const { error } = await supabase.from("marketplace_listings" as any).insert({
      seller_id: params.sellerId,
      university_id: params.universityId,
      title: params.title,
      description: params.description || null,
      price: params.price,
      category: params.category,
      image_url: params.imageUrl || null,
    } as any);
    if (error) throw error;
  },

  async deleteListing(listingId: string) {
    const { error } = await supabase.from("marketplace_listings" as any).delete().eq("id", listingId);
    if (error) throw error;
  },

  async markSold(listingId: string) {
    const { error } = await supabase.from("marketplace_listings" as any).update({ status: "sold" } as any).eq("id", listingId);
    if (error) throw error;
  },
};
