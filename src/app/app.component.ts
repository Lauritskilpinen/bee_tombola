import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';

import { ResultsTableComponent } from './components/results-table/results-table.component';
import { TombolaMachineComponent } from './components/tombola-machine/tombola-machine.component';
import { DrawnTicket, TombolaSettings } from './models/ticket.model';
import { TombolaService } from './services/tombola.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, TombolaMachineComponent, ResultsTableComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
    private static readonly SPIN_START_MS = 980;
    private static readonly DRUM_SPIN_DURATION_MS = 3000;
    private static readonly DRAW_RESULT_MS = AppComponent.SPIN_START_MS + AppComponent.DRUM_SPIN_DURATION_MS;
    private static readonly SPOTLIGHT_DURATION_MS = 4000;
    private static readonly DRAW_FINISH_BUFFER_MS = 420;

    private readonly tombolaService = inject(TombolaService);

    readonly drawnTickets = this.tombolaService.drawnTickets;
    readonly settings = this.tombolaService.settings;
    readonly remainingCount = this.tombolaService.remainingCount;
    readonly totalCount = this.tombolaService.totalCount;

    latestTicket: DrawnTicket | null = null;
    spotlightTicket: DrawnTicket | null = null;
    spotlightBeeSrc = 'assets/biavler_bien.svg';
    statusText = 'Klar til at trække';
    isDrawing = false;
    isSpinning = false;
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
        this.isSpinning = false;
        this.statusText = 'Trækker...';
        this.spotlightTicket = null;
        this.isSpotlightVisible = false;

        this.scheduleTimeout(() => {
            this.isSpinning = true;
        }, AppComponent.SPIN_START_MS);

        this.scheduleTimeout(() => {
            this.isSpinning = false;

            const drawnTicket = this.tombolaService.drawTicket();
            if (!drawnTicket) {
                this.isDrawing = false;
                this.statusText = 'Alle lodder er trukket';
                return;
            }

            this.spotlightTicket = drawnTicket;
            this.isSpotlightVisible = true;
            this.statusText = 'Håndtaget er trukket!';

            this.scheduleTimeout(() => {
                this.isSpotlightVisible = false;
                this.latestTicket = drawnTicket;
                this.spotlightTicket = null;
            }, AppComponent.SPOTLIGHT_DURATION_MS);
        }, AppComponent.DRAW_RESULT_MS);

        this.scheduleTimeout(() => {
            this.isDrawing = false;
            this.isSpinning = false;
            this.statusText = this.isExhausted ? 'Alle lodder er trukket' : 'Klar til at trække';
        }, AppComponent.DRAW_RESULT_MS + AppComponent.SPOTLIGHT_DURATION_MS + AppComponent.DRAW_FINISH_BUFFER_MS);
    }

    onResetRequested(): void {
        const shouldReset = window.confirm('Vil du nulstille?');
        if (!shouldReset) {
            return;
        }

        this.clearPendingTimeouts();
        this.tombolaService.reset();

        this.resetVisualState();
    }

    onSettingsSaved(settings: TombolaSettings): void {
        this.clearPendingTimeouts();
        this.tombolaService.updateSettings(settings);

        this.resetVisualState();
    }

    getReadableTextColor(hexColor: string): string {
        const hex = (hexColor ?? '').replace('#', '');
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
            return '#ffffff';
        }

        const red = parseInt(hex.slice(0, 2), 16);
        const green = parseInt(hex.slice(2, 4), 16);
        const blue = parseInt(hex.slice(4, 6), 16);
        const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

        return luminance > 155 ? '#1f1a14' : '#ffffff';
    }

    getSpotlightOverlayBackground(hexColor: string): string {
        const rgb = this.hexToRgb(hexColor);
        if (!rgb) {
            return 'radial-gradient(circle at 40% 30%, rgba(255, 241, 185, 0.95) 0%, rgba(255, 230, 130, 0.82) 34%, rgba(35, 15, 0, 0.8) 100%)';
        }

        const darkRed = Math.max(0, rgb.red - 75);
        const darkGreen = Math.max(0, rgb.green - 75);
        const darkBlue = Math.max(0, rgb.blue - 75);

        return `radial-gradient(circle at 40% 30%, rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.96) 0%, rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.88) 36%, rgba(${darkRed}, ${darkGreen}, ${darkBlue}, 0.9) 100%)`;
    }

    onSpotlightBeeError(): void {
        if (this.spotlightBeeSrc === 'assets/biavler_bien.svg') {
            this.spotlightBeeSrc = '/assets/biavler_bien.svg';
            return;
        }

        if (this.spotlightBeeSrc === '/assets/biavler_bien.svg') {
            this.spotlightBeeSrc = './assets/biavler_bien.svg';
        }
    }

    private resetVisualState(): void {

        this.latestTicket = null;
        this.spotlightTicket = null;
        this.isSpotlightVisible = false;
        this.isDrawing = false;
        this.isSpinning = false;
        this.statusText = 'Klar til at trække';
    }

    private hexToRgb(hexColor: string): { red: number; green: number; blue: number } | null {
        const hex = (hexColor ?? '').replace('#', '');
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
            return null;
        }

        return {
            red: parseInt(hex.slice(0, 2), 16),
            green: parseInt(hex.slice(2, 4), 16),
            blue: parseInt(hex.slice(4, 6), 16)
        };
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
