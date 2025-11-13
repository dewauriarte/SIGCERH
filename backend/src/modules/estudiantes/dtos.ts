/**
 * DTOs y validaciones para el módulo de Estudiantes
 */

import { z } from 'zod';
import { EstadoEstudiante, Sexo } from './types';

export const CreateEstudianteDTO = z.object({
  dni: z
    .string()
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI debe contener solo números'),
  nombres: z
    .string()
    .min(1, 'Los nombres son requeridos')
    .max(150, 'Los nombres no pueden exceder 150 caracteres'),
  apellidoPaterno: z
    .string()
    .min(1, 'El apellido paterno es requerido')
    .max(100, 'El apellido paterno no puede exceder 100 caracteres'),
  apellidoMaterno: z
    .string()
    .min(1, 'El apellido materno es requerido')
    .max(100, 'El apellido materno no puede exceder 100 caracteres'),
  fechaNacimiento: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val)),
  lugarNacimiento: z
    .string()
    .max(150, 'El lugar de nacimiento no puede exceder 150 caracteres')
    .optional(),
  sexo: z.nativeEnum(Sexo).default(Sexo.M),
  email: z
    .string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional(),
  telefono: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional(),
  direccion: z.string().optional(),
  observaciones: z.string().optional(),
  estado: z.nativeEnum(EstadoEstudiante).default(EstadoEstudiante.ACTIVO).optional(),
});

export type CreateEstudianteDTOType = z.infer<typeof CreateEstudianteDTO>;

export const UpdateEstudianteDTO = CreateEstudianteDTO.partial();
export type UpdateEstudianteDTOType = z.infer<typeof UpdateEstudianteDTO>;

export const FiltrosEstudianteDTO = z.object({
  search: z.string().optional(),
  estado: z.nativeEnum(EstadoEstudiante).optional(),
  sexo: z.nativeEnum(Sexo).optional(),
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});
export type FiltrosEstudianteDTOType = z.infer<typeof FiltrosEstudianteDTO>;
