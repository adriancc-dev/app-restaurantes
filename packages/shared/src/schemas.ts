import { z } from 'zod'

export const createReservationSchema = z.object({
  restaurantId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido'),
  partySize: z.number().int().min(1).max(20),
  notes: z.string().max(500).optional(),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>
