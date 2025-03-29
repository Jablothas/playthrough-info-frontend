import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoginService } from './login.service';
import { User } from '../models/user.model';
import { GameRecord } from '../models/record.model';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private apiUrl = 'https://api.ggdb.app/request';
    private records: GameRecord[] = [];
    private sessionId: string | null = null;

    constructor(
        private http: HttpClient,
        public loginService: LoginService
    ) {}

    login(user: User): Observable<any> {
        const url = `${this.apiUrl}?action=login`;

        const requestBody = {
            username: user.username.toLowerCase(),
            pwd: user.pwd
        };

        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

        console.log('Sending login request with body:', requestBody);

        return this.http.post<any>(url, JSON.stringify(requestBody), {
            headers,
            withCredentials: true
        }).pipe(
            tap(response => {
                this.sessionId = response.sessionId;
                const success = !!response.sessionId;
                this.loginService.setLoggedIn(success);

                if (success) {
                    this.loginService.setUsername(requestBody.username);
                }

                console.log('Login response:', response);
            }),
            catchError(error => {
                this.loginService.setLoggedIn(false);
                this.loginService.setUsername(null);
                console.error('Login failed:', error);
                return of({ success: false });
            })
        );
    }

    getAllRecords(username: string): Observable<GameRecord[]> {
        const url = `${this.apiUrl}?action=read&username=${username.toLowerCase()}`;

        return this.http.get<GameRecord[]>(url, {
            withCredentials: true
        }).pipe(
            tap(records => {
                this.records = records;
                console.log('Records fetched:', records.length, records);
            }),
            catchError(error => {
                console.error('Failed to load records:', error);
                return of([]);
            })
        );
    }

    getRecords(): GameRecord[] {
        return this.records;
    }

    createRecord(username: string, recordData: any): Observable<any> {
        const url = `${this.apiUrl}?action=create&username=${username.toLowerCase()}`;
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post<any>(url, JSON.stringify(recordData), {
            headers,
            withCredentials: true
        }).pipe(
            tap((res) => {
                console.log('Created record response:', res);
            }),
            catchError(error => {
                console.error('Failed to create record:', error);
                return of({ success: false });
            })
        );
    }

    logout(username: string): Observable<any> {
        const url = `${this.apiUrl}?action=logout&username=${username.toLowerCase()}`;
        return this.http.get<any>(url, { withCredentials: true }).pipe(
            tap(() => {
                this.records = [];
                this.sessionId = null;
                this.loginService.setLoggedIn(false);
                this.loginService.setUsername(null);
                console.log('Logged out');
            }),
            catchError(error => {
                console.error('Logout failed:', error);
                return of({ success: false });
            })
        );
    }
}
