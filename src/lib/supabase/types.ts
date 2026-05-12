export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          photo_url: string | null;
          role: "admin" | "user";
          approved: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          photo_url?: string | null;
          role?: "admin" | "user";
          approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          photo_url?: string | null;
          role?: "admin" | "user";
          approved?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      van_models: {
        Row: {
          id: string;
          name: string;
          image_url: string | null;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          image_url?: string | null;
          price?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          image_url?: string | null;
          price?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      sales_specs: {
        Row: {
          id: string;
          van_model_id: string;
          section: string;
          name: string;
          price: number;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          van_model_id: string;
          section: string;
          name: string;
          price?: number;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          van_model_id?: string;
          section?: string;
          name?: string;
          price?: number;
          image_url?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_specs_van_model_id_fkey";
            columns: ["van_model_id"];
            isOneToOne: false;
            referencedRelation: "van_models";
            referencedColumns: ["id"];
          },
        ];
      };
      build_specs: {
        Row: {
          id: string;
          van_model_id: string;
          section: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          van_model_id: string;
          section: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          van_model_id?: string;
          section?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "build_specs_van_model_id_fkey";
            columns: ["van_model_id"];
            isOneToOne: false;
            referencedRelation: "van_models";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          van_model_id: string;
          customer_name: string;
          order_date: string;
          fabric_color: string | null;
          floor_color: string | null;
          main_price: number;
          addons_price: number;
          total: number;
          sales_notes: string | null;
          build_notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          van_model_id: string;
          customer_name?: string;
          order_date?: string;
          fabric_color?: string | null;
          floor_color?: string | null;
          main_price?: number;
          addons_price?: number;
          total?: number;
          sales_notes?: string | null;
          build_notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          van_model_id?: string;
          customer_name?: string;
          order_date?: string;
          fabric_color?: string | null;
          floor_color?: string | null;
          main_price?: number;
          addons_price?: number;
          total?: number;
          sales_notes?: string | null;
          build_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_van_model_id_fkey";
            columns: ["van_model_id"];
            isOneToOne: false;
            referencedRelation: "van_models";
            referencedColumns: ["id"];
          },
        ];
      };
      order_sales_selections: {
        Row: {
          id: string;
          order_id: string;
          sales_spec_id: string;
          selected: boolean;
        };
        Insert: {
          id?: string;
          order_id: string;
          sales_spec_id: string;
          selected?: boolean;
        };
        Update: {
          id?: string;
          order_id?: string;
          sales_spec_id?: string;
          selected?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "order_sales_selections_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_sales_selections_sales_spec_id_fkey";
            columns: ["sales_spec_id"];
            isOneToOne: false;
            referencedRelation: "sales_specs";
            referencedColumns: ["id"];
          },
        ];
      };
      order_build_extras: {
        Row: {
          id: string;
          order_id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_build_extras_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
