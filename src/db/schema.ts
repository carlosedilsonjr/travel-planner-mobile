import 'react-native-get-random-values';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { v4 as uuid } from 'uuid';
import { sql } from 'drizzle-orm';

export const trips = sqliteTable('trips', {
  id: text('id').primaryKey().$defaultFn(() => uuid()),
  destination: text('destination'),
  starts_at: integer('starts_at', {mode: 'timestamp'}),
  ends_at: integer('ends_at', {mode: 'timestamp'}),
  is_confirmed: integer('is_confirmed', {mode: 'boolean'}).default(false),
  created_at: integer('created_at', {mode: 'timestamp'}).default(sql`(CURRENT_TIMESTAMP)`),
  // activities
  // links
  // participants
})
export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export const participants = sqliteTable('participants', {
  id: text('id').primaryKey().$defaultFn(() => uuid()),
  name: text('name'),
  email: text('email'),
  is_invited: integer('is_invited', {mode: 'boolean'}).default(false),
  is_confirmed: integer('is_confirmed', {mode: 'boolean'}).default(false),
  is_owner: integer('is_owner', {mode: 'boolean'}).default(false),
  trip_id: text('trip_id').references(() => trips.id),
})
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

export const activities = sqliteTable('activities', {
  id: text('id').primaryKey().$defaultFn(() => uuid()),
  title: text('title'),
  occurs_at: integer('occurs_at', {mode: 'timestamp'}),
  trip_id: text('trip_id').references(() => trips.id),
})
export type Activities = typeof activities.$inferSelect;
export type NewActivities = typeof activities.$inferInsert;

export const links = sqliteTable('links', {
  id: text('id').primaryKey().$defaultFn(() => uuid()),
  title: text('title'),
  url: text('url').unique(),
  trip_id: text('trip_id').references(() => trips.id),
})
export type Links = typeof links.$inferSelect;
export type NewLinks = typeof links.$inferInsert;
