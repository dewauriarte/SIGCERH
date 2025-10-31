import { z } from 'zod';
export const CreateUsuarioDTO = z.object({
    username: z
        .string()
        .min(3, 'El usuario debe tener al menos 3 caracteres')
        .max(50, 'El usuario no puede tener más de 50 caracteres')
        .regex(/^[a-zA-Z0-9_.-]+$/, 'El usuario solo puede contener letras, números, guiones y puntos'),
    email: z
        .string()
        .email('Debe ser un correo electrónico válido')
        .max(100, 'El correo no puede tener más de 100 caracteres'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(100, 'La contraseña no puede tener más de 100 caracteres')
        .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
        .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
    dni: z
        .string()
        .length(8, 'El DNI debe tener exactamente 8 dígitos')
        .regex(/^\d{8}$/, 'El DNI solo debe contener números')
        .optional(),
    nombres: z
        .string()
        .min(2, 'Los nombres deben tener al menos 2 caracteres')
        .max(150, 'Los nombres no pueden tener más de 150 caracteres')
        .optional(),
    apellidos: z
        .string()
        .min(2, 'Los apellidos deben tener al menos 2 caracteres')
        .max(150, 'Los apellidos no pueden tener más de 150 caracteres')
        .optional(),
    telefono: z
        .string()
        .regex(/^[0-9+\-\s()]+$/, 'El teléfono solo puede contener números y símbolos válidos')
        .max(20, 'El teléfono no puede tener más de 20 caracteres')
        .optional(),
    cargo: z
        .string()
        .max(100, 'El cargo no puede tener más de 100 caracteres')
        .optional(),
    rolesIds: z
        .array(z.string().uuid('Cada rol debe ser un UUID válido'))
        .optional()
        .default([]),
    activo: z.boolean().optional().default(true),
});
export const UpdateUsuarioDTO = z.object({
    username: z
        .string()
        .min(3, 'El usuario debe tener al menos 3 caracteres')
        .max(50, 'El usuario no puede tener más de 50 caracteres')
        .regex(/^[a-zA-Z0-9_.-]+$/, 'El usuario solo puede contener letras, números, guiones y puntos')
        .optional(),
    email: z
        .string()
        .email('Debe ser un correo electrónico válido')
        .max(100, 'El correo no puede tener más de 100 caracteres')
        .optional(),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(100, 'La contraseña no puede tener más de 100 caracteres')
        .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
        .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
        .optional(),
    dni: z
        .string()
        .length(8, 'El DNI debe tener exactamente 8 dígitos')
        .regex(/^\d{8}$/, 'El DNI solo debe contener números')
        .optional(),
    nombres: z
        .string()
        .min(2, 'Los nombres deben tener al menos 2 caracteres')
        .max(150, 'Los nombres no pueden tener más de 150 caracteres')
        .optional(),
    apellidos: z
        .string()
        .min(2, 'Los apellidos deben tener al menos 2 caracteres')
        .max(150, 'Los apellidos no pueden tener más de 150 caracteres')
        .optional(),
    telefono: z
        .string()
        .regex(/^[0-9+\-\s()]+$/, 'El teléfono solo puede contener números y símbolos válidos')
        .max(20, 'El teléfono no puede tener más de 20 caracteres')
        .optional(),
    cargo: z
        .string()
        .max(100, 'El cargo no puede tener más de 100 caracteres')
        .optional(),
    activo: z.boolean().optional(),
    bloqueado: z.boolean().optional(),
});
export const AsignarRolesDTO = z.object({
    rolesIds: z
        .array(z.string().uuid('Cada rol debe ser un UUID válido'))
        .min(1, 'Debe proporcionar al menos un rol'),
});
export const ListUsuariosQueryDTO = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    search: z.string().optional(),
    activo: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    rol: z.string().optional(),
});
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
export const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación en parámetros',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
//# sourceMappingURL=dtos.js.map