import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cloudProfiles = sqliteTable("cloud_profiles", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: text("created_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
});

export const campaignSaves = sqliteTable("campaign_saves", {
  profileId: text("profile_id")
    .primaryKey()
    .references(() => cloudProfiles.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull().default(0),
  payloadJson: text("payload_json").notNull(),
  checksumSha256: text("checksum_sha256").notNull(),
  clientUpdatedAt: text("client_updated_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
