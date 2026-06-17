import { z } from 'zod';

const Num = z.coerce.number();

const ActionEntrySchema = z.object({
  action_type: z.string(),
  value: Num,
  '1d_click': Num.optional(),
  '7d_click': Num.optional(),
  '28d_click': Num.optional(),
  '1d_view': Num.optional(),
});

export const InsightsRowSchema = z.object({
  spend: Num.optional().default(0),
  impressions: Num.optional().default(0),
  reach: Num.optional().default(0),
  frequency: Num.optional().default(0),
  clicks: Num.optional().default(0),
  ctr: Num.optional().default(0),
  cpc: Num.optional().default(0),
  cpm: Num.optional().default(0),
  unique_clicks: Num.optional(),
  inline_link_clicks: Num.optional(),
  cost_per_inline_link_click: Num.optional(),
  actions: z.array(ActionEntrySchema).optional().default([]),
  action_values: z.array(ActionEntrySchema).optional().default([]),
  cost_per_action_type: z.array(ActionEntrySchema).optional().default([]),
  date_start: z.string(),
  date_stop: z.string(),
  account_currency: z.string().optional(),
  campaign_id: z.string().optional(),
  campaign_name: z.string().optional(),
  adset_id: z.string().optional(),
  adset_name: z.string().optional(),
  ad_id: z.string().optional(),
  ad_name: z.string().optional(),
});

export type InsightsRow = z.infer<typeof InsightsRowSchema>;

export const InsightsResponseSchema = z.object({
  data: z.array(InsightsRowSchema),
  paging: z
    .object({
      cursors: z
        .object({
          before: z.string().optional(),
          after: z.string().optional(),
        })
        .optional(),
      next: z.string().optional(),
      previous: z.string().optional(),
    })
    .optional(),
});

export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;
