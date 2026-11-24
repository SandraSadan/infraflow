import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { RequestService, VmRequestPayload } from '../../../services/request';

@Component({
  selector: 'app-vm-request',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './vm-request.html',
  styleUrl: './vm-request.scss',
})
export class VmRequest {
  private readonly fb = inject(FormBuilder);
  private readonly requestService = inject(RequestService);
  private readonly cdr = inject(ChangeDetectorRef);

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  readonly requestForm = this.fb.group({
    vm_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
    provider: ['PROXMOX', Validators.required],
    os: ['Ubuntu 24.04', Validators.required],
    cpu: [2, [Validators.required, Validators.min(1), Validators.max(32)]],
    ram: [4, [Validators.required, Validators.min(1), Validators.max(128)]],
    disk: [40, [Validators.required, Validators.min(10), Validators.max(2000)]],
    environment: ['DEV', Validators.required],
    description: ['', Validators.maxLength(500)],
  });

  submitRequest(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    const payload = this.requestForm.getRawValue() as VmRequestPayload;

    this.isSubmitting = true;

    this.requestService.createRequest(payload).subscribe({
      next: () => {
        this.successMessage = 'VM request submitted successfully. It is awaiting approval.';
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message || 'Unable to submit the VM request. Please try again.';
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }
}
