import { sql } from "drizzle-orm";
import { boolean, char, check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
};

// Better Auth core schema. Property names intentionally match its adapter contract.
export const user = pgTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(), image: text("image"), ...timestamps,
}, (t) => [uniqueIndex("user_email_lower_uidx").on(sql`lower(${t.email})`)]);
export const session = pgTable("session", {
  id: text("id").primaryKey(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  ipAddress: text("ip_address"), userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (t) => [index("session_user_id_idx").on(t.userId), index("session_expires_at_idx").on(t.expiresAt)]);
export const account = pgTable("account", {
  id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), accessToken: text("access_token"),
  refreshToken: text("refresh_token"), idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }), scope: text("scope"),
  password: text("password"), ...timestamps,
}, (t) => [uniqueIndex("account_provider_account_uidx").on(t.providerId, t.accountId), index("account_user_id_idx").on(t.userId)]);
export const verification = pgTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), ...timestamps,
}, (t) => [index("verification_identifier_idx").on(t.identifier), index("verification_expires_at_idx").on(t.expiresAt)]);

export const productType = pgEnum("product_type", ["application", "game", "lesson"]);
export const orderStatus = pgEnum("order_status", ["draft", "pending_payment", "paid", "failed", "cancelled", "refunded", "partially_refunded"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "processing", "succeeded", "failed", "cancelled", "refunded", "partially_refunded"]);
export const licenseStatus = pgEnum("license_status", ["active", "suspended", "revoked", "refunded"]);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), namePt: text("name_pt").notNull(),
  nameEn: text("name_en").notNull(), type: productType("type").notNull(), active: boolean("active").default(true).notNull(), ...timestamps,
});
export const productEditions = pgTable("product_editions", {
  id: uuid("id").defaultRandom().primaryKey(), productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  editionCode: text("edition_code").notNull(), locale: text("locale").notNull(), title: text("title").notNull(), version: text("version").default("1").notNull(),
  publishable: boolean("publishable").default(false).notNull(), active: boolean("active").default(true).notNull(), ...timestamps,
}, (t) => [uniqueIndex("product_editions_product_code_uidx").on(t.productId, t.editionCode), index("product_editions_product_id_idx").on(t.productId)]);
export const skus = pgTable("skus", {
  id: uuid("id").defaultRandom().primaryKey(), productEditionId: uuid("product_edition_id").notNull().references(() => productEditions.id, { onDelete: "restrict" }),
  code: text("code").notNull().unique(), lessonCode: text("lesson_code"), priceMinor: integer("price_minor").notNull(),
  currency: char("currency", { length: 3 }).default("EUR").notNull(), active: boolean("active").default(true).notNull(), ...timestamps,
}, (t) => [check("skus_price_non_negative", sql`${t.priceMinor} >= 0`), check("skus_currency_uppercase", sql`${t.currency} = upper(${t.currency})`), index("skus_product_edition_id_idx").on(t.productEditionId)]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(), orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }), status: orderStatus("status").default("draft").notNull(),
  currency: char("currency", { length: 3 }).default("EUR").notNull(), subtotalMinor: integer("subtotal_minor").notNull(), totalMinor: integer("total_minor").notNull(),
  provider: text("provider"), providerCheckoutId: text("provider_checkout_id").unique(), idempotencyKey: text("idempotency_key").notNull().unique(), ...timestamps,
}, (t) => [check("orders_subtotal_non_negative", sql`${t.subtotalMinor} >= 0`), check("orders_total_non_negative", sql`${t.totalMinor} >= 0`), index("orders_user_id_created_at_idx").on(t.userId, t.createdAt), index("orders_status_idx").on(t.status)]);
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(), orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  skuId: uuid("sku_id").notNull().references(() => skus.id, { onDelete: "restrict" }), quantity: integer("quantity").default(1).notNull(),
  unitPriceMinor: integer("unit_price_minor").notNull(), currency: char("currency", { length: 3 }).notNull(), skuCodeSnapshot: text("sku_code_snapshot").notNull(),
  titleSnapshot: text("title_snapshot").notNull(), localeSnapshot: text("locale_snapshot").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("order_items_order_sku_uidx").on(t.orderId, t.skuId), check("order_items_single_digital_unit", sql`${t.quantity} = 1`), check("order_items_price_non_negative", sql`${t.unitPriceMinor} >= 0`), index("order_items_order_id_idx").on(t.orderId)]);
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(), orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  provider: text("provider").notNull(), providerPaymentId: text("provider_payment_id").notNull(), status: paymentStatus("status").default("pending").notNull(),
  amountMinor: integer("amount_minor").notNull(), currency: char("currency", { length: 3 }).notNull(), failureCode: text("failure_code"),
  paidAt: timestamp("paid_at", { withTimezone: true }), ...timestamps,
}, (t) => [uniqueIndex("payments_provider_payment_uidx").on(t.provider, t.providerPaymentId), check("payments_amount_non_negative", sql`${t.amountMinor} >= 0`), index("payments_order_id_idx").on(t.orderId)]);
export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").defaultRandom().primaryKey(), provider: text("provider").notNull(), providerEventId: text("provider_event_id").notNull(), eventType: text("event_type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(), receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }), processingError: text("processing_error"),
}, (t) => [uniqueIndex("payment_events_provider_event_uidx").on(t.provider, t.providerEventId), index("payment_events_processed_at_idx").on(t.processedAt)]);

export const licenses = pgTable("licenses", {
  id: uuid("id").defaultRandom().primaryKey(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  skuId: uuid("sku_id").notNull().references(() => skus.id, { onDelete: "restrict" }), orderItemId: uuid("order_item_id").notNull().references(() => orderItems.id, { onDelete: "restrict" }),
  status: licenseStatus("status").default("active").notNull(), grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }), reason: text("reason"), ...timestamps,
}, (t) => [uniqueIndex("licenses_user_sku_uidx").on(t.userId, t.skuId), uniqueIndex("licenses_order_item_uidx").on(t.orderItemId), index("licenses_user_status_idx").on(t.userId, t.status)]);
export const licenseEvents = pgTable("license_events", {
  id: uuid("id").defaultRandom().primaryKey(), licenseId: uuid("license_id").notNull().references(() => licenses.id, { onDelete: "restrict" }),
  eventType: text("event_type").notNull(), actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }), reason: text("reason"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("license_events_license_id_idx").on(t.licenseId)]);
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(), actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(), subjectType: text("subject_type").notNull(), subjectId: text("subject_id").notNull(), requestId: text("request_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("audit_events_subject_idx").on(t.subjectType, t.subjectId), index("audit_events_created_at_idx").on(t.createdAt)]);

// Reserved for real future learning/game state. No fictional progress is seeded.
export const activityProgress = pgTable("activity_progress", {
  id: uuid("id").defaultRandom().primaryKey(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  skuId: uuid("sku_id").notNull().references(() => skus.id, { onDelete: "restrict" }), activityKey: text("activity_key").notNull(),
  state: jsonb("state").$type<Record<string, unknown>>().default({}).notNull(), ...timestamps,
}, (t) => [uniqueIndex("activity_progress_user_sku_key_uidx").on(t.userId, t.skuId, t.activityKey), index("activity_progress_user_id_idx").on(t.userId)]);
