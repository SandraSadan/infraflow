import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VmRequestPayload {
  vm_name: string;
  provider: 'PROXMOX' | 'AWS' | 'AZURE' | 'GCP';
  os: string;
  cpu: number;
  ram: number;
  disk: number;
  environment: 'DEV' | 'STAGE' | 'PROD';
  description: string;
}

export interface InfrastructureRequest {
  id: number;
  user_id: number;
  vm_name: string;
  provider: 'PROXMOX' | 'AWS' | 'AZURE' | 'GCP';
  os: string;
  cpu: number;
  ram: number;
  disk: number;
  environment: 'DEV' | 'STAGE' | 'PROD';
  description: string;
  status: string;
  created_at: string;
  requester_name?: string;
  requester_email?: string;
}

interface RequestsResponse {
  success: boolean;
  data: InfrastructureRequest[];
}

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/requests';

  createRequest(payload: VmRequestPayload): Observable<unknown> {
    const token = localStorage.getItem('infraflow_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(this.apiUrl, payload, { headers });
  }

  getRequests(): Observable<RequestsResponse> {
    const token = localStorage.getItem('infraflow_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RequestsResponse>(this.apiUrl, { headers });
  }
}
