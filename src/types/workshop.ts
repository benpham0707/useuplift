import { z } from "zod";

export const IssueDescriptionSchema = z.object({
  problem: z.string(),
  actionable: z.string(),
  quotes: z.array(z.string()),
});

export const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: IssueDescriptionSchema,
  severity: z.enum(["high", "medium"]),
  highlightedText: z.string(),
});

export const DimensionGainSchema = z.object({
  name: z.string(),
  value: z.number(),
});

export const WorkshopDataSchema = z.object({
  beforeText: z.string(),
  afterText: z.string(),
  beforeCharCount: z.number(),
  afterCharCount: z.number(),
  issues: z.array(IssueSchema),
  score: z.object({
    current: z.number(),
    projected: z.number(),
    narrative: z.string(),
    dimensions: z.array(DimensionGainSchema),
  }),
});

export type WorkshopData = z.infer<typeof WorkshopDataSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type IssueDescription = z.infer<typeof IssueDescriptionSchema>;
