import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL || "postgres://postgres:postgres@localhost:5432/chatgpt4kids";

const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

async function seed() {
  try {
    // Add some initial topics
    await db.insert(schema.topic).values([
      { name: 'Science' },
      { name: 'Math' },
      { name: 'History' },
      { name: 'Geography' },
    ]);
    
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
    process.exit(0);
  }
}

seed();