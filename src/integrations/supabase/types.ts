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
      campus_alerts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          posted_by: string | null
          resolved_at: string | null
          severity: string | null
          title: string
          university_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          posted_by?: string | null
          resolved_at?: string | null
          severity?: string | null
          title: string
          university_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          posted_by?: string | null
          resolved_at?: string | null
          severity?: string | null
          title?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_alerts_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campus_alerts_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_updates: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          inserted_at: string | null
          source: string | null
          source_type: string | null
          source_url: string | null
          title: string
          university_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          inserted_at?: string | null
          source?: string | null
          source_type?: string | null
          source_url?: string | null
          title: string
          university_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          inserted_at?: string | null
          source?: string | null
          source_type?: string | null
          source_url?: string | null
          title?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_updates_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          category: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          logo_url: string | null
          members_count: number | null
          name: string
          university_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          logo_url?: string | null
          members_count?: number | null
          name: string
          university_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          members_count?: number | null
          name?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
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
      confessions: {
        Row: {
          alias: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          moderation_status: string | null
          reactions_count: number | null
          university_id: string
          user_id: string | null
        }
        Insert: {
          alias?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          moderation_status?: string | null
          reactions_count?: number | null
          university_id: string
          user_id?: string | null
        }
        Update: {
          alias?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          moderation_status?: string | null
          reactions_count?: number | null
          university_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confessions_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_aliases: {
        Row: {
          alias: string
          alias_date: string
          content_type: string
          user_id: string
        }
        Insert: {
          alias: string
          alias_date: string
          content_type: string
          user_id: string
        }
        Update: {
          alias?: string
          alias_date?: string
          content_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_aliases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          read: boolean | null
          sender_alias: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          read?: boolean | null
          sender_alias?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          read?: boolean | null
          sender_alias?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_threads: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_threads_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_threads_user_b_fkey"
            columns: ["user_b"]
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
      event_bookmarks: {
        Row: {
          event_id: string
          user_id: string
        }
        Insert: {
          event_id: string
          user_id: string
        }
        Update: {
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookmarks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checkins: {
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
            foreignKeyName: "event_checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_messages: {
        Row: {
          content: string
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_user_id_fkey"
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
          end_date: string | null
          event_date: string
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          title: string
          university_id: string
          verification_level: string | null
        }
        Insert: {
          attendees_count?: number | null
          cover_image?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          title: string
          university_id: string
          verification_level?: string | null
        }
        Update: {
          attendees_count?: number | null
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          title?: string
          university_id?: string
          verification_level?: string | null
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
      feature_flags: {
        Row: {
          enabled: boolean | null
          feature_key: string
          id: string
          updated_at: string | null
        }
        Insert: {
          enabled?: boolean | null
          feature_key: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          enabled?: boolean | null
          feature_key?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      jobs: {
        Row: {
          company: string | null
          contact_info: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          job_type: string
          location: string | null
          pay: string | null
          poster_id: string
          status: string
          title: string
          university_id: string
        }
        Insert: {
          company?: string | null
          contact_info?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          job_type?: string
          location?: string | null
          pay?: string | null
          poster_id: string
          status?: string
          title: string
          university_id: string
        }
        Update: {
          company?: string | null
          contact_info?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          job_type?: string
          location?: string | null
          pay?: string | null
          poster_id?: string
          status?: string
          title?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_note_bookmarks: {
        Row: {
          created_at: string | null
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_note_bookmarks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "lecture_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecture_note_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_note_upvotes: {
        Row: {
          created_at: string | null
          id: string
          note_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_note_upvotes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "lecture_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_notes: {
        Row: {
          ai_tagged: boolean | null
          course: string | null
          course_code: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          downloads_count: number | null
          file_type: string | null
          file_url: string
          id: string
          subject: string | null
          title: string
          topics: string[] | null
          university_id: string
          upvotes_count: number | null
          user_id: string
        }
        Insert: {
          ai_tagged?: boolean | null
          course?: string | null
          course_code?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          downloads_count?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          subject?: string | null
          title: string
          topics?: string[] | null
          university_id: string
          upvotes_count?: number | null
          user_id: string
        }
        Update: {
          ai_tagged?: boolean | null
          course?: string | null
          course_code?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          downloads_count?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          subject?: string | null
          title?: string
          topics?: string[] | null
          university_id?: string
          upvotes_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_notes_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
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
      lost_found: {
        Row: {
          created_at: string | null
          description: string | null
          has_sensitive: boolean | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          item_type: string
          location: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          university_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          has_sensitive?: boolean | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          item_type?: string
          location?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          university_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          has_sensitive?: boolean | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          item_type?: string
          location?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string
          condition: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          moderation_status: string | null
          payment_methods: string[] | null
          pickup_location: string | null
          price: number
          seller_id: string
          status: string
          title: string
          university_id: string
        }
        Insert: {
          category?: string
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          moderation_status?: string | null
          payment_methods?: string[] | null
          pickup_location?: string | null
          price: number
          seller_id: string
          status?: string
          title: string
          university_id: string
        }
        Update: {
          category?: string
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          moderation_status?: string | null
          payment_methods?: string[] | null
          pickup_location?: string | null
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
      marketplace_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          listing_id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          listing_id: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          options: Json
          question: string
          university_id: string
          user_id: string
          votes_count: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          options?: Json
          question: string
          university_id: string
          user_id: string
          votes_count?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          options?: Json
          question?: string
          university_id?: string
          user_id?: string
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
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
          graduation_level: string | null
          graduation_year: string | null
          id: string
          last_active_at: string | null
          last_updates_seen_at: string | null
          major: string | null
          peek_university_id: string | null
          personal_url: string | null
          reputation_score: number | null
          shadow_reduced: boolean | null
          shadow_reduced_at: string | null
          streak_days: number | null
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
          graduation_level?: string | null
          graduation_year?: string | null
          id: string
          last_active_at?: string | null
          last_updates_seen_at?: string | null
          major?: string | null
          peek_university_id?: string | null
          personal_url?: string | null
          reputation_score?: number | null
          shadow_reduced?: boolean | null
          shadow_reduced_at?: string | null
          streak_days?: number | null
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
          graduation_level?: string | null
          graduation_year?: string | null
          id?: string
          last_active_at?: string | null
          last_updates_seen_at?: string | null
          major?: string | null
          peek_university_id?: string | null
          personal_url?: string | null
          reputation_score?: number | null
          shadow_reduced?: boolean | null
          shadow_reduced_at?: string | null
          streak_days?: number | null
          university_id?: string | null
          updated_at?: string | null
          username?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_peek_university_id_fkey"
            columns: ["peek_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
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
      rides: {
        Row: {
          created_at: string | null
          departure_time: string
          departure_window_end: string | null
          description: string | null
          from_lat: number | null
          from_lng: number | null
          from_location: string
          id: string
          price: number | null
          role: string | null
          seats_available: number
          status: string
          to_lat: number | null
          to_lng: number | null
          to_location: string
          university_id: string
          user_id: string
          vehicle_desc: string | null
        }
        Insert: {
          created_at?: string | null
          departure_time: string
          departure_window_end?: string | null
          description?: string | null
          from_lat?: number | null
          from_lng?: number | null
          from_location: string
          id?: string
          price?: number | null
          role?: string | null
          seats_available?: number
          status?: string
          to_lat?: number | null
          to_lng?: number | null
          to_location: string
          university_id: string
          user_id: string
          vehicle_desc?: string | null
        }
        Update: {
          created_at?: string | null
          departure_time?: string
          departure_window_end?: string | null
          description?: string | null
          from_lat?: number | null
          from_lng?: number | null
          from_location?: string
          id?: string
          price?: number | null
          role?: string | null
          seats_available?: number
          status?: string
          to_lat?: number | null
          to_lng?: number | null
          to_location?: string
          university_id?: string
          user_id?: string
          vehicle_desc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          post_id: string
          post_type: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          post_id: string
          post_type: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          post_id?: string
          post_type?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spotted_comments: {
        Row: {
          alias: string | null
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          post_id: string
          user_id: string
        }
        Insert: {
          alias?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          post_id: string
          user_id: string
        }
        Update: {
          alias?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotted_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "spotted_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotted_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spotted_posts: {
        Row: {
          alias: string | null
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          image_url: string | null
          is_anonymous: boolean | null
          location: string
          moderation_status: string | null
          spotted_time: string | null
          title: string
          university_id: string
          user_id: string
        }
        Insert: {
          alias?: string | null
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean | null
          location: string
          moderation_status?: string | null
          spotted_time?: string | null
          title: string
          university_id: string
          user_id: string
        }
        Update: {
          alias?: string | null
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean | null
          location?: string
          moderation_status?: string | null
          spotted_time?: string | null
          title?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotted_posts_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      spotted_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotted_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "spotted_posts"
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
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_url: string
          story_type?: string | null
          university_id: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_url?: string
          story_type?: string | null
          university_id?: string
          user_id?: string
          view_count?: number | null
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
      study_group_announcements: {
        Row: {
          author_id: string | null
          body: string
          created_at: string | null
          group_id: string | null
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_announcements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          group_id: string
          id: string
          uploader_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          group_id: string
          id?: string
          uploader_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          group_id?: string
          id?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_files_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_files_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_messages: {
        Row: {
          content: string | null
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          group_id: string | null
          id: string
          message_type: string | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          message_type?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          message_type?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          announcement_at: string | null
          announcement_body: string | null
          announcement_by: string | null
          announcement_title: string | null
          course: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          max_members: number | null
          members_count: number | null
          name: string
          university_id: string
        }
        Insert: {
          announcement_at?: string | null
          announcement_body?: string | null
          announcement_by?: string | null
          announcement_title?: string | null
          course?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          max_members?: number | null
          members_count?: number | null
          name: string
          university_id: string
        }
        Update: {
          announcement_at?: string | null
          announcement_body?: string | null
          announcement_by?: string | null
          announcement_title?: string | null
          course?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          max_members?: number | null
          members_count?: number | null
          name?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_groups_announcement_by_fkey"
            columns: ["announcement_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_groups_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
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
          campus_lat: number | null
          campus_lng: number | null
          city: string | null
          country: string | null
          created_at: string | null
          domain: string | null
          email_domain: string | null
          id: string
          logo_url: string | null
          name: string
          short_name: string | null
        }
        Insert: {
          campus_lat?: number | null
          campus_lng?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          email_domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          short_name?: string | null
        }
        Update: {
          campus_lat?: number | null
          campus_lng?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          email_domain?: string | null
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
      wall_comments: {
        Row: {
          alias: string
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          wall_post_id: string
        }
        Insert: {
          alias: string
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          wall_post_id: string
        }
        Update: {
          alias?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          wall_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "wall_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_comments_wall_post_id_fkey"
            columns: ["wall_post_id"]
            isOneToOne: false
            referencedRelation: "wall_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_downvotes: {
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
            foreignKeyName: "wall_downvotes_wall_post_id_fkey"
            columns: ["wall_post_id"]
            isOneToOne: false
            referencedRelation: "wall_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_posts: {
        Row: {
          alias: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          downvotes: number | null
          expires_at: string | null
          id: string
          moderation_reason: string | null
          moderation_status: string | null
          university_id: string
          upvotes: number | null
          user_id: string | null
        }
        Insert: {
          alias?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          downvotes?: number | null
          expires_at?: string | null
          id?: string
          moderation_reason?: string | null
          moderation_status?: string | null
          university_id: string
          upvotes?: number | null
          user_id?: string | null
        }
        Update: {
          alias?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          downvotes?: number | null
          expires_at?: string | null
          id?: string
          moderation_reason?: string | null
          moderation_status?: string | null
          university_id?: string
          upvotes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wall_posts_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      calculate_trending_score: {
        Args: {
          p_comments: number
          p_created_at: string
          p_joins: number
          p_likes: number
          p_views: number
        }
        Returns: number
      }
      get_my_university_id: { Args: never; Returns: string }
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
      is_admin: { Args: never; Returns: boolean }
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
