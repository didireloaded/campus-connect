export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendees_count: number | null
          cover_image: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          event_date: string
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          title: string
          university_id: string
        }
        Insert: {
          attendees_count?: number | null
          cover_image?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          event_date: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          title: string
          university_id: string
        }
        Update: {
          attendees_count?: number | null
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          event_date?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          title?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          price: number
          seller_id: string
          status: string
          title: string
          university_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          price: number
          seller_id: string
          status?: string
          title: string
          university_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number
          seller_id?: string
          status?: string
          title?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string
          read: boolean | null
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          likes_count: number | null
          moderation_reason: string | null
          moderation_status: string | null
          university_id: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          moderation_reason?: string | null
          moderation_status?: string | null
          university_id: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          moderation_reason?: string | null
          moderation_status?: string | null
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          university_id: string | null
          updated_at: string | null
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          university_id?: string | null
          updated_at?: string | null
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          university_id?: string | null
          updated_at?: string | null
          username?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string | null
          id: string
          reason: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          media_url: string
          story_type: string | null
          university_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_url: string
          story_type?: string | null
          university_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_url?: string
          story_type?: string | null
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_topics: {
        Row: {
          detected_at: string | null
          expires_at: string | null
          id: string
          post_count: number | null
          topic: string
          university_id: string
        }
        Insert: {
          detected_at?: string | null
          expires_at?: string | null
          id?: string
          post_count?: number | null
          topic: string
          university_id: string
        }
        Update: {
          detected_at?: string | null
          expires_at?: string | null
          id?: string
          post_count?: number | null
          topic?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trending_topics_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          short_name: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          short_name?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wall_posts: {
        Row: {
          alias: string | null
          content: string
          created_at: string | null
          id: string
          moderation_reason: string | null
          moderation_status: string | null
          university_id: string
          upvotes: number | null
        }
        Insert: {
          alias?: string | null
          content: string
          created_at?: string | null
          id?: string
          moderation_reason?: string | null
          moderation_status?: string | null
          university_id: string
          upvotes?: number | null
        }
        Update: {
          alias?: string | null
          content?: string
          created_at?: string | null
          id?: string
          moderation_reason?: string | null
          moderation_status?: string | null
          university_id?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wall_posts_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_upvotes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          wall_post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          wall_post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          wall_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_upvotes_wall_post_id_fkey"
            columns: ["wall_post_id"]
            isOneToOne: false
            referencedRelation: "wall_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_ranked_feed: {
        Args: { p_limit?: number; p_offset?: number; p_university_id: string }
        Returns: {
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string
          likes_count: number
          score: number
          university_id: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
