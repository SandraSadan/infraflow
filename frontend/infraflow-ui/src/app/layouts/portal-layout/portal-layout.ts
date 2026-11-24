import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-layout.html',
  styleUrl: './portal-layout.scss',
})
export class PortalLayout {
  readonly auth = inject(Auth);
  private readonly router = inject(Router);

  get user() {
    return this.auth.getUser();
  }

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
