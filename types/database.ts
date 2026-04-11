export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          nombre: string;
          apellido: string | null;
          email: string;
          avatar_url: string | null;
          fecha_nacimiento: string | null;
          peso_kg: number | null;
          altura_cm: number | null;
          genero: "masculino" | "femenino" | null;
          telefono: string | null;
          porcentaje_grasa: string | null;
          lesiones: string | null;
          rol: "usuario" | "admin";
          activo: boolean;
          perfil_completo: boolean;
        };
        Insert: {
          id: string;
          nombre: string;
          email: string;
          created_at?: string;
          apellido?: string | null;
          avatar_url?: string | null;
          fecha_nacimiento?: string | null;
          peso_kg?: number | null;
          altura_cm?: number | null;
          genero?: "masculino" | "femenino" | null;
          telefono?: string | null;
          porcentaje_grasa?: string | null;
          lesiones?: string | null;
          rol?: "usuario" | "admin";
          activo?: boolean;
          perfil_completo?: boolean;
        };
        Update: {
          id?: string;
          nombre?: string;
          email?: string;
          created_at?: string;
          apellido?: string | null;
          avatar_url?: string | null;
          fecha_nacimiento?: string | null;
          peso_kg?: number | null;
          altura_cm?: number | null;
          genero?: "masculino" | "femenino" | null;
          telefono?: string | null;
          porcentaje_grasa?: string | null;
          lesiones?: string | null;
          rol?: "usuario" | "admin";
          activo?: boolean;
          perfil_completo?: boolean;
        };
        Relationships: [];
      };
      membresias: {
        Row: {
          id: string;
          created_at: string;
          usuario_id: string;
          tipo_plan: "mensual" | "trimestral" | "semestral" | "anual";
          fecha_inicio: string;
          fecha_fin: string;
          estado: "activa" | "vencida" | "suspendida" | "pendiente";
          renovacion_habilitada: boolean;
          plan_nutricional_habilitado: boolean;
          notas: string | null;
          monto_pagado: number | null;
        };
        Insert: {
          usuario_id: string;
          tipo_plan: "mensual" | "trimestral" | "semestral" | "anual";
          fecha_inicio: string;
          fecha_fin: string;
          id?: string;
          created_at?: string;
          estado?: "activa" | "vencida" | "suspendida" | "pendiente";
          renovacion_habilitada?: boolean;
          plan_nutricional_habilitado?: boolean;
          notas?: string | null;
          monto_pagado?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          usuario_id?: string;
          tipo_plan?: "mensual" | "trimestral" | "semestral" | "anual";
          fecha_inicio?: string;
          fecha_fin?: string;
          estado?: "activa" | "vencida" | "suspendida" | "pendiente";
          renovacion_habilitada?: boolean;
          plan_nutricional_habilitado?: boolean;
          notas?: string | null;
          monto_pagado?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "membresias_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rutinas: {
        Row: {
          id: string;
          created_at: string;
          usuario_id: string;
          membresia_id: string | null;
          datos_input: Json;
          texto_rutina: string;
          duracion_plan: string;
          estado: "activa" | "archivada";
          modelo_ia: string;
          tokens_usados: number | null;
        };
        Insert: {
          usuario_id: string;
          datos_input: Json;
          texto_rutina: string;
          duracion_plan: string;
          id?: string;
          created_at?: string;
          membresia_id?: string | null;
          estado?: "activa" | "archivada";
          modelo_ia?: string;
          tokens_usados?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          usuario_id?: string;
          membresia_id?: string | null;
          datos_input?: Json;
          texto_rutina?: string;
          duracion_plan?: string;
          estado?: "activa" | "archivada";
          modelo_ia?: string;
          tokens_usados?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "rutinas_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rutinas_membresia_id_fkey";
            columns: ["membresia_id"];
            isOneToOne: false;
            referencedRelation: "membresias";
            referencedColumns: ["id"];
          },
        ];
      };
      ejercicios: {
        Row: {
          id: string;
          created_at: string;
          nombre: string;
          descripcion: string | null;
          instrucciones: string;
          grupo_muscular: string;
          categoria: string;
          nivel: "principiante" | "intermedio" | "avanzado" | "todos";
          imagen_url: string | null;
          video_url: string | null;
          activo: boolean;
        };
        Insert: {
          nombre: string;
          instrucciones: string;
          grupo_muscular: string;
          categoria: string;
          id?: string;
          created_at?: string;
          descripcion?: string | null;
          nivel?: "principiante" | "intermedio" | "avanzado" | "todos";
          imagen_url?: string | null;
          video_url?: string | null;
          activo?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          nombre?: string;
          descripcion?: string | null;
          instrucciones?: string;
          grupo_muscular?: string;
          categoria?: string;
          nivel?: "principiante" | "intermedio" | "avanzado" | "todos";
          imagen_url?: string | null;
          video_url?: string | null;
          activo?: boolean;
        };
        Relationships: [];
      };
      logs_acceso: {
        Row: {
          id: string;
          created_at: string;
          usuario_id: string | null;
          accion: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          usuario_id?: string | null;
          accion?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          usuario_id?: string | null;
          accion?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "logs_acceso_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      historial_ejercicios: {
        Row: {
          id: string;
          user_id: string;
          ejercicio_id: string;
          tiempo_descanso_minutos: number;
          fecha_completado: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ejercicio_id: string;
          tiempo_descanso_minutos: number;
          fecha_completado?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ejercicio_id?: string;
          tiempo_descanso_minutos?: number;
          fecha_completado?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "historial_ejercicios_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "historial_ejercicios_ejercicio_id_fkey";
            columns: ["ejercicio_id"];
            isOneToOne: false;
            referencedRelation: "ejercicios";
            referencedColumns: ["id"];
          }
        ];
      };
      series_ejercicios: {
        Row: {
          id: string;
          historial_origen_id: string;
          serie_numero: number;
          peso_kg: number;
          repeticiones: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          historial_origen_id: string;
          serie_numero: number;
          peso_kg: number;
          repeticiones: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          historial_origen_id?: string;
          serie_numero?: number;
          peso_kg?: number;
          repeticiones?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "series_ejercicios_historial_origen_id_fkey";
            columns: ["historial_origen_id"];
            isOneToOne: false;
            referencedRelation: "historial_ejercicios";
            referencedColumns: ["id"];
          }
        ];
      };
      planes_nutricionales: {
        Row: {
          id: string;
          user_id: string;
          texto_plan: string;
          objetivo: string;
          nivel_actividad: string | null;
          horario_entrenamiento: string | null;
          restricciones: string | null;
          estado: "activa" | "archivada";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          texto_plan: string;
          objetivo: string;
          nivel_actividad?: string | null;
          horario_entrenamiento?: string | null;
          restricciones?: string | null;
          estado?: "activa" | "archivada";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          texto_plan?: string;
          objetivo?: string;
          nivel_actividad?: string | null;
          horario_entrenamiento?: string | null;
          restricciones?: string | null;
          estado?: "activa" | "archivada";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "planes_nutricionales_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
