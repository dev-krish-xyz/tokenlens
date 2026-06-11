import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  decimal,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: text('plan').default('free'),
  plan_tier: text('plan_tier').notNull().default('free'),
  budget_cap: decimal('budget_cap', { precision: 10, scale: 4 }),
  slack_webhook_url: text('slack_webhook_url'),
  stripe_customer_id: text('stripe_customer_id'),
  stripe_subscription_id: text('stripe_subscription_id'),
  created_at: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  created_at: timestamp('created_at').defaultNow(),
});

export const workspace_members = pgTable(
  'workspace_members',
  {
    workspace_id: uuid('workspace_id')
      .references(() => workspaces.id)
      .notNull(),
    user_id: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    role: text('role').notNull(),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspace_id, t.user_id] }),
    index('idx_workspace_members_workspace_id').on(t.workspace_id),
  ],
);

export const virtual_keys = pgTable(
  'virtual_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .references(() => workspaces.id)
      .notNull(),
    name: text('name').notNull(),
    provider: text('provider').notNull(),
    encrypted_key: text('encrypted_key').notNull(),
    budget_cap: decimal('budget_cap', { precision: 10, scale: 4 }),
    is_active: boolean('is_active').default(true),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => [index('idx_virtual_keys_workspace_id').on(t.workspace_id)],
);

export const model_pricing = pgTable('model_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  model_pattern: text('model_pattern').notNull(),
  input_price_per_m: decimal('input_price_per_m', {
    precision: 10,
    scale: 6,
  }).notNull(),
  output_price_per_m: decimal('output_price_per_m', {
    precision: 10,
    scale: 6,
  }).notNull(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const alert_configs = pgTable(
  'alert_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .references(() => workspaces.id)
      .notNull(),
    channel: text('channel').notNull(),
    threshold_pct: integer('threshold_pct').notNull().default(80),
    cooldown_min: integer('cooldown_min').default(60),
    is_active: boolean('is_active').default(true),
  },
  (t) => [index('idx_alert_configs_workspace_id').on(t.workspace_id)],
);

export type Workspace = InferSelectModel<typeof workspaces>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type WorkspaceMember = InferSelectModel<typeof workspace_members>;
export type NewWorkspaceMember = InferInsertModel<typeof workspace_members>;

export type VirtualKey = InferSelectModel<typeof virtual_keys>;
export type NewVirtualKey = InferInsertModel<typeof virtual_keys>;

export type ModelPricing = InferSelectModel<typeof model_pricing>;
export type NewModelPricing = InferInsertModel<typeof model_pricing>;

export type AlertConfig = InferSelectModel<typeof alert_configs>;
export type NewAlertConfig = InferInsertModel<typeof alert_configs>;

export const workspace_invites = pgTable(
  'workspace_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    email: text('email').notNull(),
    role: text('role').notNull().default('member'),
    token: text('token').notNull().unique(),
    expires_at: timestamp('expires_at').notNull(),
    accepted_at: timestamp('accepted_at'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('idx_workspace_invites_token').on(t.token),
    index('idx_workspace_invites_workspace_id').on(t.workspace_id),
  ],
);

export type WorkspaceInvite = InferSelectModel<typeof workspace_invites>;
export type NewWorkspaceInvite = InferInsertModel<typeof workspace_invites>;
