import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  date,
  json,
  jsonb,
  uuid,
  boolean,
  integer,
  primaryKey,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  stripeStatusPaid: boolean('stripeStatusPaid').notNull().default(false),
});
export type User = InferSelectModel<typeof user>;


export const personaType = pgEnum('persona_type', ['parent', 'child']);

export const persona = pgTable(
  'Persona',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId').notNull().references(() => user.id),
    type: personaType('type').notNull(),
    displayName: varchar('displayName', { length: 64 }).notNull(),
    pinHash: varchar('pinHash', { length: 128 }),
    parentPersonaId: uuid('parentPersonaId'),
    avatar: varchar('avatar', { length: 255 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    persona_parent_check: check(
      'persona_parent_check',
      sql`${table.type} != 'child' OR ${table.parentPersonaId} IS NOT NULL`
    ),
    persona_parent_fk: foreignKey({
      columns: [table.parentPersonaId],
      foreignColumns: [persona.id],
    }),
  })
) as unknown as ReturnType<typeof pgTable>;
export type Persona = InferSelectModel<typeof persona>;
export type NewPersona = InferInsertModel<typeof persona>;

export const personaSettings = pgTable('PersonaSettings', {
  personaId: uuid('personaId').primaryKey().notNull().references(() => persona.id),
  topicRestriction: varchar('topicRestriction', { enum: ['low', 'medium', 'high'] })
    .notNull()
    .default('medium'),
  filters: jsonb('filters').notNull().default(JSON.stringify({ violence: false, politics: false })),
  homeworkMode: boolean('homeworkMode').notNull().default(false),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});
export type PersonaSettings = InferSelectModel<typeof personaSettings>;

export const wordFilter = pgTable('WordFilter', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  personaId: uuid('personaId').notNull().references(() => persona.id),
  word: text('word').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});
export type WordFilter = InferSelectModel<typeof wordFilter>;


export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId').notNull().references(() => user.id),
  personaId: uuid('personaId').notNull().references(() => persona.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
  deletedAt: timestamp('deletedAt'),
});
export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId').notNull().references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});
export type Message = InferSelectModel<typeof message>;
export type NewMessage = InferInsertModel<typeof message>;

export const messageUsage = pgTable('MessageUsage', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId').notNull(),
  msgId: uuid('msgId'),
  usage: jsonb('usage').notNull(),
  category: text('category'),
});
export type NewMessageUsage = InferInsertModel<typeof messageUsage>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId').notNull().references(() => chat.id),
    messageId: uuid('messageId').notNull().references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);
export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId').notNull().references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  })
);
export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId').notNull().references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);
export type Suggestion = InferSelectModel<typeof suggestion>;

export const flaggedMessage = pgTable('FlaggedMessage', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  messageId: uuid('messageId').notNull().references(() => message.id),
  flaggedByPersonaId: uuid('flaggedByPersonaId').notNull().references(() => persona.id),
  reason: varchar('reason', { enum: ['violence', 'politics', 'wordFilter', 'other'] }).notNull(),
  details: text('details'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});
export type FlaggedMessage = InferSelectModel<typeof flaggedMessage>;


export const usageReport = pgTable(
  'UsageReport',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    personaId: uuid('personaId').notNull().references(() => persona.id),
    date: date('date').notNull(),
    chatsStarted: integer('chatsStarted').notNull().default(0),
    messagesSent: integer('messagesSent').notNull().default(0),
    wordsSent: integer('wordsSent').notNull().default(0),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    ux: primaryKey({ columns: [table.personaId, table.date] }),
  })
);
export type UsageReport = InferSelectModel<typeof usageReport>;

export const topic = pgTable('Topic', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 64 }).notNull(),
});
export type Topic = InferSelectModel<typeof topic>;

export const chatTopic = pgTable(
  'ChatTopic',
  {
    chatId: uuid('chatId').notNull().references(() => chat.id),
    topicId: uuid('topicId').notNull().references(() => topic.id),
    relevanceScore: integer('relevanceScore').notNull().default(0),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.topicId] }),
  })
);
export type ChatTopic = InferSelectModel<typeof chatTopic>;

export const favoriteTopic = pgTable(
  'FavoriteTopic',
  {
    personaId: uuid('personaId').notNull().references(() => persona.id),
    topicId: uuid('topicId').notNull().references(() => topic.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.personaId, table.topicId] }),
  })
);
export type FavoriteTopic = InferSelectModel<typeof favoriteTopic>;

export const educationalSuggestion = pgTable('EducationalSuggestion', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  personaId: uuid('personaId').notNull().references(() => persona.id),
  suggestion: text('suggestion').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});
export type EducationalSuggestion = InferSelectModel<typeof educationalSuggestion>;
