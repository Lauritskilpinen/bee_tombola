export type TicketColor = 'red' | 'blue';

export interface Ticket {
    number: number;
    color: TicketColor;
}

export interface DrawnTicket extends Ticket {
    order: number;
    drawnAt: Date;
}
