import { Injectable, computed, signal } from '@angular/core';

import { DrawnTicket, Ticket } from '../models/ticket.model';

@Injectable({
    providedIn: 'root'
})
export class TombolaService {
    private static readonly NUMBERS_PER_COLOR = 1000;
    private static readonly COLORS: Ticket['color'][] = ['red', 'blue'];
    private static readonly TOTAL_TICKETS = TombolaService.NUMBERS_PER_COLOR * TombolaService.COLORS.length;

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
        const tickets: Ticket[] = [];

        for (let number = 1; number <= TombolaService.NUMBERS_PER_COLOR; number += 1) {
            for (const color of TombolaService.COLORS) {
                tickets.push({ number, color });
            }
        }

        return tickets;
    }
}
