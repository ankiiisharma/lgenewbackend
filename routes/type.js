import { z } from "zod";

export const userSchema = z.object({
    name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long" })
        .max(50, { message: "Name must be less than 50 characters" })
        .default("Default Name"),  // Defaults to "Default Name" if not provided

    email: z
        .string()
        .email({ message: "Invalid email format" })
        .max(255, { message: "Email must be less than 255 characters" }),

    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .regex(/[A-Za-z0-9]/, { message: "Password must contain letters and numbers" }),  // Example: password strength validation
});
