import { z } from "zod";

export const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>;

export const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
});

export type UserPayload = z.infer<typeof tokenPayloadSchema>;

export const createCategoryBodySchema = z.object({
  name: z.string(),
});

export type CreateCategoryBodySchema = z.infer<typeof createCategoryBodySchema>;

export const createAccountBodySchema = z.object({
  name: z.string(),
  userName: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>;

export const envSchema = z.object({
  DB_HOST: z.string(),
  DB_PORT: z.string().default("5432"),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_DATABASE: z.string(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export const createTagBodySchema = z.object({
  name: z.string(),
});

export type CreateTagBodySchema = z.infer<typeof createTagBodySchema>;

export const createUserBodySchema = z.object({
  name: z.string(),
  userName: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  birthDate: z.coerce.date().refine((date) => date <= new Date(), {
    message: "Birthdate must be in the past",
  }),
});

export type CreateUserBodySchema = z.infer<typeof createUserBodySchema>;
