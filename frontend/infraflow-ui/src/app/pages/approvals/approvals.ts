import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  RequestService,
  InfrastructureRequest,
} from '../../services/request';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './approvals.html',
  styleUrl: './approvals.scss',
})
export class Approvals implements OnInit {
  private readonly requestService = inject(RequestService);
  private readonly cdr = inject(ChangeDetectorRef);

  requests: InfrastructureRequest[] = [];
  commentsByRequest: Record<number, string> = {};
  processingRequestIds: number[] = [];

  isLoading = true;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadRequests();
  }

  get pendingRequests(): InfrastructureRequest[] {
    return this.requests.filter(
      (request) => request.status === 'PENDING_APPROVAL'
    );
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
        this.errorMessage = 'Unable to load approval requests.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  processDecision(
    requestId: number,
    decision: 'APPROVED' | 'REJECTED'
  ): void {
    if (this.processingRequestIds.includes(requestId)) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';
    this.processingRequestIds = [
      ...this.processingRequestIds,
      requestId,
    ];

    const comments = this.commentsByRequest[requestId]?.trim() || undefined;

    const action =
      decision === 'APPROVED'
        ? this.requestService.approveRequest(requestId, comments)
        : this.requestService.rejectRequest(requestId, comments);

    action.subscribe({
      next: (response) => {
        this.requests = this.requests.map((request) =>
          request.id === requestId ? response.data : request
        );

        this.successMessage = response.message;
        this.finishProcessing(requestId);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message || 'Unable to process this request.';
        this.finishProcessing(requestId);
      },
    });
  }

  private finishProcessing(requestId: number): void {
    this.processingRequestIds =
      this.processingRequestIds.filter((id) => id !== requestId);

    this.cdr.markForCheck();
  }

  getStatusLabel(status: string): string {
    return status.replaceAll('_', ' ');
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replaceAll('_', '-');
  }
}
