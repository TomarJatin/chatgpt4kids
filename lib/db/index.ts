import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// biome-ignore lint: Forbidden non-null assertion.
const connectionString = process.env.POSTGRES_URL!;

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 });

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });