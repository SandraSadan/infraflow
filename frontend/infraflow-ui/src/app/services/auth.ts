import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'REQUESTER' | 'ADMIN';
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/demo`, { email })
      .pipe(
        tap((response) => {
          localStorage.setItem('infraflow_token', response.token);
          localStorage.setItem(
            'infraflow_user',
            JSON.stringify(response.user)
          );
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('infraflow_token');
  }

  getUser(): AuthUser | null {
    const user = localStorage.getItem('infraflow_user');
    return user ? JSON.parse(user) as AuthUser : null;
  }

  logout(): void {
    localStorage.removeItem('infraflow_token');
    localStorage.removeItem('infraflow_user');
  }
}
