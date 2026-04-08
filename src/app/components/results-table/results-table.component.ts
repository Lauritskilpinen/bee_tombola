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
}
