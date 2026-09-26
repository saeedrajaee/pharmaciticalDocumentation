import { z } from "zod";

export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name Must be at least 2 character long." })
    .trim(),

  mobile: z
    .string()
    .trim(),

  password: z
    .string()
    .min(8, { message: "Be at least 8 characters long" })
    .regex(/[a-zA-Z]/, { message: "Contain at least one letter" })
    .regex(/[0-9]/, { message: "Contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Contain at least one spacial character",
    })
    .trim(),
});

export const LoginFormSchema = z.object({
  mobile: z
    .string()
    .trim(),

  password: z
    .string()
    .min(8, { message: "Password field must not be empty" }),
});

export const Role = {
  ADMIN: "ADMIN",
  USER: "USER",
};
