import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RequestService, InfrastructureRequest } from '../../services/request';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './requests.html',
  styleUrl: './requests.scss',
})
export class Requests implements OnInit {
  private readonly requestService = inject(RequestService);
  private readonly cdr = inject(ChangeDetectorRef);

  requests: InfrastructureRequest[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.requestService.getRequests().subscribe({
      next: (response) => {
        this.requests = response.data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load your infrastructure requests.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getStatusLabel(status: string): string {
    return status.replaceAll('_', ' ');
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replaceAll('_', '-');
  }
}
