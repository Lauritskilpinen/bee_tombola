import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { DrawnTicket } from '../../models/ticket.model';

@Component({
    selector: 'app-results-table',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './results-table.component.html',
    styleUrl: './results-table.component.css'
})
export class ResultsTableComponent {
    @Input({ required: true }) drawnTickets: DrawnTicket[] = [];

    trackByOrder(_: number, ticket: DrawnTicket): number {
        return ticket.order;
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
}
