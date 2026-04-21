import { v4 as uuidv4 } from 'uuid';

interface TicketData {
  userId: string;
  expiresAt: number;
}

const ticketCache = new Map<string, TicketData>();

export const generateTicket = (userId: string): string => {
  const ticket = uuidv4();
  // Ticket expires in 30 seconds
  ticketCache.set(ticket, { userId, expiresAt: Date.now() + 30000 });
  return ticket;
};

export const consumeTicket = (ticket: string): string | null => {
  const data = ticketCache.get(ticket);
  if (!data) return null;
  
  ticketCache.delete(ticket); // Immediately burn ticket
  
  if (data.expiresAt < Date.now()) {
    return null; // Expired
  }
  
  return data.userId;
};
