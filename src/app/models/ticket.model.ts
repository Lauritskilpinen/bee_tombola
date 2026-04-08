export interface TicketColorOption {
    id: string;
    label: string;
    hex: string;
}

export interface TombolaSettings {
    numbersPerColor: number;
    colors: TicketColorOption[];
}

export interface Ticket {
    number: number;
    colorId: string;
    colorLabel: string;
    colorHex: string;
}

export interface DrawnTicket extends Ticket {
    order: number;
    drawnAt: Date;
}
