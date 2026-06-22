import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/startupforge', {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
});
const db = client.db();

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
    trustedOrigins: [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"].filter(Boolean),
    advanced: { crossSubDomainCookies: { enabled: true } },
    database: mongodbAdapter(db, {
        collectionNames: {
            user: "users",
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: { type: "string" },
            isPremium: { type: "boolean" },
            isBlocked: { type: "boolean" },
            image: { type: "string" },
            bio: { type: "string" },
            skills: { type: "string[]" },
            experience: { type: "string" }
        }
    }
});
