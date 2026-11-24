import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  RequestService,
  InfrastructureRequest,
} from '../../../services/request';

interface TerraformConfig {
  id: number;
  vm_name: string;
  provider: string;
  status: string;
  terraform_config: string;
}

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './request-details.html',
  styleUrl: './request-details.scss',
})
export class RequestDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly requestService = inject(RequestService);
  private readonly cdr = inject(ChangeDetectorRef);

  request: InfrastructureRequest | null = null;
  terraformConfig: TerraformConfig | null = null;

  isLoading = true;
  isTerraformLoading = false;

  errorMessage = '';
  terraformErrorMessage = '';

  ngOnInit(): void {
    const requestId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(requestId) || requestId <= 0) {
      this.errorMessage = 'Invalid infrastructure request ID.';
      this.isLoading = false;
      return;
    }

    this.loadRequest(requestId);
  }

  loadRequest(requestId: number): void {
    this.requestService.getRequestById(requestId).subscribe({
      next: (response) => {
        this.request = response.data;
        this.isLoading = false;
        this.cdr.markForCheck();

        this.loadTerraformConfig(requestId);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message || 'Unable to load request details.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadTerraformConfig(requestId: number): void {
    this.isTerraformLoading = true;
    this.terraformErrorMessage = '';

    this.requestService.getTerraformConfig(requestId).subscribe({
      next: (response) => {
        this.terraformConfig = response.data;
        this.isTerraformLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.terraformErrorMessage =
          error.error?.message ||
          'Unable to retrieve Terraform configuration.';
        this.isTerraformLoading = false;
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
