import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';

import { DrawnTicket } from '../../models/ticket.model';

@Component({
    selector: 'app-tombola-machine',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tombola-machine.component.html',
    styleUrl: './tombola-machine.component.css'
})
export class TombolaMachineComponent implements OnChanges, OnDestroy {
    @Input({ required: true }) latestTicket: DrawnTicket | null = null;
    @Input({ required: true }) statusText = 'Klar til at traekke';
    @Input({ required: true }) remainingCount = 0;
    @Input({ required: true }) totalCount = 0;
    @Input({ required: true }) isDrawing = false;
    @Input({ required: true }) isSpinning = false;
    @Input({ required: true }) isExhausted = false;

    @Output() drawRequested = new EventEmitter<void>();
    @Output() resetRequested = new EventEmitter<void>();

    ticketRevealActive = false;

    private revealTimeoutId: number | null = null;

    get drawDisabled(): boolean {
        return this.isDrawing || this.isExhausted;
    }

    get resetDisabled(): boolean {
        return this.isDrawing;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['latestTicket']?.currentValue) {
            this.playTicketRevealAnimation();
        }
    }

    ngOnDestroy(): void {
        this.clearRevealTimer();
    }

    onDrawClick(): void {
        if (this.drawDisabled) {
            return;
        }

        this.drawRequested.emit();
    }

    onResetClick(): void {
        if (this.resetDisabled) {
            return;
        }

        this.resetRequested.emit();
    }

    private playTicketRevealAnimation(): void {
        this.ticketRevealActive = false;
        this.clearRevealTimer();

        // Short delay keeps re-trigger reliable when draws happen quickly.
        this.revealTimeoutId = window.setTimeout(() => {
            this.ticketRevealActive = true;
        }, 20);
    }

    private clearRevealTimer(): void {
        if (this.revealTimeoutId !== null) {
            window.clearTimeout(this.revealTimeoutId);
            this.revealTimeoutId = null;
        }
    }
}
