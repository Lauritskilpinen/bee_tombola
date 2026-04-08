import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';

import { ResultsTableComponent } from './components/results-table/results-table.component';
import { TombolaMachineComponent } from './components/tombola-machine/tombola-machine.component';
import { DrawnTicket } from './models/ticket.model';
import { TombolaService } from './services/tombola.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, TombolaMachineComponent, ResultsTableComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
    private static readonly DRAW_MOMENT_MS = 980;
    private static readonly SPOTLIGHT_DURATION_MS = 1200;
    private static readonly DRAW_FINISH_BUFFER_MS = 420;

    private readonly tombolaService = inject(TombolaService);

    readonly drawnTickets = this.tombolaService.drawnTickets;
    readonly remainingCount = this.tombolaService.remainingCount;
    readonly totalCount = this.tombolaService.totalCount;

    latestTicket: DrawnTicket | null = null;
    spotlightTicket: DrawnTicket | null = null;
    statusText = 'Ready to draw';
    isDrawing = false;
    isSpotlightVisible = false;

    private pendingTimeoutIds: number[] = [];

    get isExhausted(): boolean {
        return this.remainingCount() === 0;
    }

    onDrawRequested(): void {
        if (this.isDrawing || this.isExhausted) {
            return;
        }

        this.isDrawing = true;
        this.statusText = 'Drawing...';
        this.spotlightTicket = null;
        this.isSpotlightVisible = false;

        this.scheduleTimeout(() => {
            const drawnTicket = this.tombolaService.drawTicket();
            if (!drawnTicket) {
                this.isDrawing = false;
                this.statusText = 'All tickets have been drawn';
                return;
            }

            this.spotlightTicket = drawnTicket;
            this.isSpotlightVisible = true;
            this.statusText = 'Ticket drawn!';

            this.scheduleTimeout(() => {
                this.isSpotlightVisible = false;
                this.latestTicket = drawnTicket;
                this.spotlightTicket = null;
            }, AppComponent.SPOTLIGHT_DURATION_MS);
        }, AppComponent.DRAW_MOMENT_MS);

        this.scheduleTimeout(() => {
            this.isDrawing = false;
            this.statusText = this.isExhausted ? 'All tickets have been drawn' : 'Ready to draw';
        }, AppComponent.DRAW_MOMENT_MS + AppComponent.SPOTLIGHT_DURATION_MS + AppComponent.DRAW_FINISH_BUFFER_MS);
    }

    onResetRequested(): void {
        this.clearPendingTimeouts();
        this.tombolaService.reset();

        this.latestTicket = null;
        this.spotlightTicket = null;
        this.isSpotlightVisible = false;
        this.isDrawing = false;
        this.statusText = 'Ready to draw';
    }

    ngOnDestroy(): void {
        this.clearPendingTimeouts();
    }

    private clearPendingTimeouts(): void {
        for (const timeoutId of this.pendingTimeoutIds) {
            window.clearTimeout(timeoutId);
        }

        this.pendingTimeoutIds = [];
    }

    private scheduleTimeout(action: () => void, delayMs: number): void {
        const timeoutId = window.setTimeout(() => {
            this.pendingTimeoutIds = this.pendingTimeoutIds.filter((id) => id !== timeoutId);
            action();
        }, delayMs);

        this.pendingTimeoutIds.push(timeoutId);
    }
}
