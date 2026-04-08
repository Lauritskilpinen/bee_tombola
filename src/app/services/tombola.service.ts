import { Injectable, computed, signal } from '@angular/core';

import { DrawnTicket, Ticket } from '../models/ticket.model';

@Injectable({
    providedIn: 'root'
})
export class TombolaService {
    private static readonly TOTAL_TICKETS = 1000;

    private readonly availableTicketsState = signal<Ticket[]>([]);
    private readonly drawnTicketsState = signal<DrawnTicket[]>([]);

    readonly drawnTickets = this.drawnTicketsState.asReadonly();
    readonly remainingCount = computed(() => this.availableTicketsState().length);
    readonly hasRemainingTickets = computed(() => this.remainingCount() > 0);
    readonly totalCount = TombolaService.TOTAL_TICKETS;

    constructor() {
        this.reset();
    }

    drawTicket(): DrawnTicket | null {
        const availableTickets = [...this.availableTicketsState()];
        if (availableTickets.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * availableTickets.length);
        const [selectedTicket] = availableTickets.splice(randomIndex, 1);

        const drawnTicket: DrawnTicket = {
            ...selectedTicket,
            order: this.drawnTicketsState().length + 1,
            drawnAt: new Date()
        };

        this.availableTicketsState.set(availableTickets);
        this.drawnTicketsState.update((currentTickets) => [...currentTickets, drawnTicket]);

        return drawnTicket;
    }

    reset(): void {
        this.availableTicketsState.set(this.generateTickets());
        this.drawnTicketsState.set([]);
    }

    private generateTickets(): Ticket[] {
        return Array.from({ length: TombolaService.TOTAL_TICKETS }, (_, index) => ({
            number: index + 1,
            color: Math.random() < 0.5 ? 'red' : 'blue'
        }));
    }
}
