export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      venues: {
        Row: {
          id: string
          name: string
          address: string
          description: string | null
          photos: string[]
          capacity: number
          kitchen_notes: string | null
          map_embed_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          description?: string | null
          photos?: string[]
          capacity?: number
          kitchen_notes?: string | null
          map_embed_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          description?: string | null
          photos?: string[]
          capacity?: number
          kitchen_notes?: string | null
          map_embed_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          slug: string
          venue_id: string | null
          event_date: string
          event_time: string
          total_seats: number
          booked_seats: number
          price_per_seat: number
          wine_pairing: boolean
          wine_price: number | null
          status: 'draft' | 'published' | 'sold_out' | 'completed' | 'cancelled'
          description: string | null
          booking_deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          venue_id?: string | null
          event_date: string
          event_time: string
          total_seats?: number
          booked_seats?: number
          price_per_seat: number
          wine_pairing?: boolean
          wine_price?: number | null
          status?: 'draft' | 'published' | 'sold_out' | 'completed' | 'cancelled'
          description?: string | null
          booking_deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          venue_id?: string | null
          event_date?: string
          event_time?: string
          total_seats?: number
          booked_seats?: number
          price_per_seat?: number
          wine_pairing?: boolean
          wine_price?: number | null
          status?: 'draft' | 'published' | 'sold_out' | 'completed' | 'cancelled'
          description?: string | null
          booking_deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
        ]
      }
      courses: {
        Row: {
          id: string
          event_id: string
          sequence: number
          course_type: string
          dish_title: string
          description: string | null
          dietary_tags: string[]
          photo_url: string | null
          wine_name: string | null
          wine_region: string | null
          wine_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          sequence: number
          course_type: string
          dish_title: string
          description?: string | null
          dietary_tags?: string[]
          photo_url?: string | null
          wine_name?: string | null
          wine_region?: string | null
          wine_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          sequence?: number
          course_type?: string
          dish_title?: string
          description?: string | null
          dietary_tags?: string[]
          photo_url?: string | null
          wine_name?: string | null
          wine_region?: string | null
          wine_note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'courses_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      guests: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          event_id: string
          guest_id: string
          pax: number
          wine_pairing_count: number
          status: 'confirmed' | 'cancelled' | 'no_show'
          total_price: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          guest_id: string
          pax?: number
          wine_pairing_count?: number
          status?: 'confirmed' | 'cancelled' | 'no_show'
          total_price: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          guest_id?: string
          pax?: number
          wine_pairing_count?: number
          status?: 'confirmed' | 'cancelled' | 'no_show'
          total_price?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          },
        ]
      }
      guest_details: {
        Row: {
          id: string
          booking_id: string
          guest_name: string
          allergies: string[]
          other_allergies: string | null
          dietary_restrictions: string[]
          severity: 'preference' | 'intolerance' | 'life_threatening'
          special_requests: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          guest_name: string
          allergies?: string[]
          other_allergies?: string | null
          dietary_restrictions?: string[]
          severity?: 'preference' | 'intolerance' | 'life_threatening'
          special_requests?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          guest_name?: string
          allergies?: string[]
          other_allergies?: string | null
          dietary_restrictions?: string[]
          severity?: 'preference' | 'intolerance' | 'life_threatening'
          special_requests?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'guest_details_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          guest_name: string
          rating: number
          quote: string
          event_id: string | null
          is_featured: boolean
          is_visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          guest_name: string
          rating: number
          quote: string
          event_id?: string | null
          is_featured?: boolean
          is_visible?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          guest_name?: string
          rating?: number
          quote?: string
          event_id?: string | null
          is_featured?: boolean
          is_visible?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      past_dishes: {
        Row: {
          id: string
          event_id: string | null
          dish_name: string
          description: string | null
          course_type: string | null
          photo_url: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          dish_name: string
          description?: string | null
          course_type?: string | null
          photo_url: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          dish_name?: string
          description?: string | null
          course_type?: string | null
          photo_url?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'past_dishes_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking: {
        Args: {
          p_event_id: string
          p_guest_name: string
          p_guest_email: string
          p_guest_phone: string
          p_pax: number
          p_wine_pairing_count: number
          p_guest_details: Json
        }
        Returns: string
      }
    }
    Enums: {
      event_status: 'draft' | 'published' | 'sold_out' | 'completed' | 'cancelled'
      booking_status: 'confirmed' | 'cancelled' | 'no_show'
      allergy_severity: 'preference' | 'intolerance' | 'life_threatening'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
