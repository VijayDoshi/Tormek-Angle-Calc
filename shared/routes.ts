
import { z } from 'zod';
import { insertMachineSettingsSchema, insertWheelSchema, insertCalculatorStateSchema, machineSettings, wheels, calculatorState } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof machineSettings.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/settings',
      input: insertMachineSettingsSchema.partial(),
      responses: {
        200: z.custom<typeof machineSettings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  wheels: {
    list: {
      method: 'GET' as const,
      path: '/api/wheels',
      responses: {
        200: z.array(z.custom<typeof wheels.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/wheels',
      input: insertWheelSchema,
      responses: {
        201: z.custom<typeof wheels.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/wheels/:id',
      input: insertWheelSchema.partial(),
      responses: {
        200: z.custom<typeof wheels.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/wheels/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  state: {
    get: {
      method: 'GET' as const,
      path: '/api/state',
      responses: {
        200: z.custom<typeof calculatorState.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/state',
      input: insertCalculatorStateSchema.partial(),
      responses: {
        200: z.custom<typeof calculatorState.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
