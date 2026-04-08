import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DrawnTicket, TicketColorOption, TombolaSettings } from '../../models/ticket.model';

interface EditableColorOption {
    id: string;
    label: string;
    hex: string;
}

@Component({
    selector: 'app-tombola-machine',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tombola-machine.component.html',
    styleUrl: './tombola-machine.component.css'
})
export class TombolaMachineComponent implements OnChanges, OnDestroy {
    private static readonly MAX_NUMBERS_PER_COLOR = 10000;

    @Input({ required: true }) latestTicket: DrawnTicket | null = null;
    @Input({ required: true }) statusText = 'Klar til at traekke';
    @Input({ required: true }) remainingCount = 0;
    @Input({ required: true }) totalCount = 0;
    @Input({ required: true }) isDrawing = false;
    @Input({ required: true }) isSpinning = false;
    @Input({ required: true }) isExhausted = false;
    @Input({ required: true }) settings: TombolaSettings = { numbersPerColor: 1000, colors: [] };

    @Output() drawRequested = new EventEmitter<void>();
    @Output() resetRequested = new EventEmitter<void>();
    @Output() settingsSaved = new EventEmitter<TombolaSettings>();

    ticketRevealActive = false;
    isSettingsOpen = false;
    settingsError = '';
    draftNumbersPerColor = 1000;
    draftColors: EditableColorOption[] = [];

    private revealTimeoutId: number | null = null;
    private nextColorIndex = 1;

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

        if (changes['settings'] && !this.isSettingsOpen) {
            this.populateDraftFromSettings();
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

    onSettingsToggle(): void {
        this.isSettingsOpen = !this.isSettingsOpen;
        this.settingsError = '';

        if (this.isSettingsOpen) {
            this.populateDraftFromSettings();
        }
    }

    onCancelSettings(): void {
        this.isSettingsOpen = false;
        this.settingsError = '';
    }

    onAddColor(): void {
        const colorNumber = this.nextColorIndex;
        this.nextColorIndex += 1;
        this.draftColors.push({
            id: `farve-${colorNumber}`,
            label: `Farve ${colorNumber}`,
            hex: this.pickDefaultColor(this.draftColors.length)
        });
    }

    onRemoveColor(index: number): void {
        if (this.draftColors.length <= 1) {
            return;
        }

        this.draftColors.splice(index, 1);
    }

    onSaveSettings(): void {
        const normalizedNumberInput = Number(this.draftNumbersPerColor);

        if (!Number.isFinite(normalizedNumberInput)) {
            this.settingsError = 'Antal numre skal være et tal.';
            return;
        }

        const numbersPerColor = Math.max(
            1,
            Math.min(TombolaMachineComponent.MAX_NUMBERS_PER_COLOR, Math.floor(normalizedNumberInput))
        );

        const normalizedColors = this.normalizeDraftColors(this.draftColors);
        if (normalizedColors.length === 0) {
            this.settingsError = 'Tilføj mindst en farve med navn.';
            return;
        }

        this.settingsSaved.emit({
            numbersPerColor,
            colors: normalizedColors
        });

        this.isSettingsOpen = false;
        this.settingsError = '';
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

    private populateDraftFromSettings(): void {
        this.draftNumbersPerColor = this.settings.numbersPerColor;
        this.draftColors = this.settings.colors.map((color) => ({ ...color }));
        this.nextColorIndex = this.settings.colors.length + 1;
    }

    private normalizeDraftColors(colors: EditableColorOption[]): TicketColorOption[] {
        const uniqueIds = new Set<string>();
        const normalizedColors: TicketColorOption[] = [];

        for (const [index, color] of colors.entries()) {
            const label = (color.label ?? '').trim();
            if (!label) {
                continue;
            }

            const baseId = this.toColorId(color.id) || this.toColorId(label) || `farve-${index + 1}`;
            let id = baseId;
            let duplicateCounter = 2;
            while (uniqueIds.has(id)) {
                id = `${baseId}-${duplicateCounter}`;
                duplicateCounter += 1;
            }

            uniqueIds.add(id);
            normalizedColors.push({
                id,
                label,
                hex: this.normalizeHexColor(color.hex)
            });
        }

        return normalizedColors;
    }

    private toColorId(value: string): string {
        const normalized = (value ?? '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        return normalized;
    }

    private normalizeHexColor(value: string): string {
        const normalized = (value ?? '').trim();
        if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
            return normalized.toLowerCase();
        }

        return '#2573be';
    }

    private pickDefaultColor(index: number): string {
        const palette = ['#d04a4a', '#4c8ed8', '#2f8c4f', '#ce8a2e', '#7d57c6', '#1598a8'];
        return palette[index % palette.length];
    }
}
