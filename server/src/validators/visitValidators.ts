import { z } from 'zod';

export const createVisitSchema = z.object({
  visitDate: z.string().min(1, 'Visit date is required'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  notes: z.string().max(500).optional(),
});

export const updateVisitStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED']),
  ownerNotes: z.string().max(500).optional(),
});

export const createInquirySchema = z.object({
  message: z.string().min(5, 'Inquiry message must be at least 5 characters').max(1000),
});

export const replyInquirySchema = z.object({
  ownerReply: z.string().min(2, 'Reply message is required').max(1000),
});

export const createReportSchema = z.object({
  reason: z.string().min(3, 'Reason is required'),
  details: z.string().max(1000).optional(),
});
