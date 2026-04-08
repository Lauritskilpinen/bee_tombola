import { Injectable, computed, signal } from '@angular/core';

import { DrawnTicket, Ticket, TicketColorOption, TombolaSettings } from '../models/ticket.model';

@Injectable({
    providedIn: 'root'
})
export class TombolaService {
    private static readonly DEFAULT_SETTINGS: TombolaSettings = {
        numbersPerColor: 1000,
        colors: [
            { id: 'yellow', label: 'Gul', hex: '#f2c335' },
            { id: 'orange', label: 'Orange', hex: '#eb8c2f' }
        ]
    };

    private readonly availableTicketsState = signal<Ticket[]>([]);
    private readonly drawnTicketsState = signal<DrawnTicket[]>([]);
    private readonly settingsState = signal<TombolaSettings>(TombolaService.createDefaultSettings());

    readonly drawnTickets = this.drawnTicketsState.asReadonly();
    readonly settings = this.settingsState.asReadonly();
    readonly remainingCount = computed(() => this.availableTicketsState().length);
    readonly hasRemainingTickets = computed(() => this.remainingCount() > 0);
    readonly totalCount = computed(() => {
        const settings = this.settingsState();
        return settings.numbersPerColor * settings.colors.length;
    });

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

    updateSettings(nextSettings: TombolaSettings): void {
        const normalizedSettings = this.normalizeSettings(nextSettings);
        this.settingsState.set(normalizedSettings);
        this.reset();
    }

    private static createDefaultSettings(): TombolaSettings {
        return {
            numbersPerColor: TombolaService.DEFAULT_SETTINGS.numbersPerColor,
            colors: TombolaService.DEFAULT_SETTINGS.colors.map((color) => ({ ...color }))
        };
    }

    private normalizeSettings(nextSettings: TombolaSettings): TombolaSettings {
        const numbersPerColor = Math.max(1, Math.floor(nextSettings.numbersPerColor));
        const cleanedColors: TicketColorOption[] = [];

        for (const color of nextSettings.colors) {
            const id = (color.id ?? '').trim().toLowerCase();
            const label = (color.label ?? '').trim();
            const hex = this.normalizeHexColor(color.hex);

            if (!id || !label) {
                continue;
            }

            if (cleanedColors.some((item) => item.id === id)) {
                continue;
            }

            cleanedColors.push({ id, label, hex });
        }

        if (cleanedColors.length === 0) {
            return TombolaService.createDefaultSettings();
        }

        return {
            numbersPerColor,
            colors: cleanedColors
        };
    }

    private normalizeHexColor(value: string): string {
        const fallback = '#2573be';
        const normalized = (value ?? '').trim();

        if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
            return fallback;
        }

        return normalized.toLowerCase();
    }

    private generateTickets(): Ticket[] {
        const settings = this.settingsState();
        const tickets: Ticket[] = [];

        for (let number = 1; number <= settings.numbersPerColor; number += 1) {
            for (const color of settings.colors) {
                tickets.push({
                    number,
                    colorId: color.id,
                    colorLabel: color.label,
                    colorHex: color.hex
                });
            }
        }

        return tickets;
    }
}
