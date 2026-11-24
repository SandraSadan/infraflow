import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly email = new FormControl('requester@infraflow.local', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  loading = false;
  errorMessage = '';

  selectAccount(email: string): void {
    this.email.setValue(email);
    this.errorMessage = '';
  }

  login(): void {
    if (this.email.invalid || this.loading) {
      this.email.markAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.email.value).subscribe({
      next: (response) => {
        this.loading = false;
        const destination = 
          response.user.role === 'ADMIN' ? '/approvals' : '/catalog';
        this.cdr.markForCheck();
        this.router.navigate([destination]);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message || 'Unable to sign in. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }
}
