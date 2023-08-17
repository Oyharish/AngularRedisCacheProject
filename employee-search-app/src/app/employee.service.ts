import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  constructor(private http: HttpClient) { }
  private baseURL = `http://localhost:3000/api/company`;

  getEmployees(): Observable<any[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      })
    };

    return this.http.get<any[]>(this.baseURL, httpOptions);
  }

  async updateCache(filteredData: any[]) {
    try {
      const response = await this.http.post(this.baseURL, filteredData);
      console.log('Cache updated:', response);
    } catch (error) {
      console.error('Error updating cache:', error);
      throw error;
    }
  }

  fetchEmployeesFromDatabase(nameQuery: string, ageQuery: string, addressQuery: string, salaryQuery: string): Observable<any> {
    return this.http.get<any>(`${this.baseURL}/search`, {
      params: {
        name: nameQuery,
        age: ageQuery,
        address: addressQuery,
        salary: salaryQuery
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError('Something bad happened; please try again later.');
  }
}
