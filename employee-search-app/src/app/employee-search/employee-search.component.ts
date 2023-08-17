import { Component, OnInit } from '@angular/core';
import { EmployeeService } from '../employee.service';

@Component({
  selector: 'app-employee-search',
  templateUrl: './employee-search.component.html',
  styleUrls: ['./employee-search.component.css']
})
export class EmployeeSearchComponent implements OnInit {

  nameQuery: string = '';
  nameSuggestions: string[] = [];
  ageQuery: string = '';
  ageSuggestions: string[] = [];
  addressQuery: string = '';
  addressSuggestions: string[] = [];
  salaryQuery: string = '';
  salarySuggestions: string[] = [];

  allEmployee: any[] = [];
  filteredEmployees: any[] = [];

  nameCache: Record<string, string[]> = {};
  ageCache: Record<string, string[]> = {};
  addressCache: Record<string, string[]> = {};
  salaryCache: Record<string, string[]> = {};


  constructor(private employeeService: EmployeeService) { }

  ngOnInit() {
    this.fetchAndCacheEmployees();
  }

  fetchAndCacheEmployees() {
    this.employeeService.getEmployees()
      .subscribe(
        (employees: any[]) => {
          this.allEmployee = employees;
          this.filteredEmployees = employees;
          this.cacheInitialData();
        },
        (error: any) => {
          console.error(error);
        }
      );
  }

  cacheInitialData() {
    this.allEmployee.forEach((employee: any) => {
      this.cacheEmployeeField(employee, 'name', this.nameCache);
      this.cacheEmployeeField(employee, 'age', this.ageCache);
      this.cacheEmployeeField(employee, 'address', this.addressCache);
      this.cacheEmployeeField(employee, 'salary', this.salaryCache);
    });
  }

  cacheEmployeeField(employee: any, field: string, cache: Record<string, string[]>) {
    const fieldValue = employee[field];
    if (typeof fieldValue === 'string') {
      const cacheKey = fieldValue;
      if (!cache[cacheKey]) {
        cache[cacheKey] = [];
      }
      cache[cacheKey].push(fieldValue);
      console.log(JSON.stringify(cache));
    }
  }
  // clearCache() {
  //   this.nameCache = {};
  //   this.ageCache = {};
  //   this.addressCache = {};
  //   this.salaryCache = {};
  //   console.log('Cache has been cleared.');
  // }

  // onSearchClick() {
  //   this.clearSuggestions();
  //   // this.fetchAndCacheEmployees()
  //   this.filteredEmployees = this.allEmployee
  //     .filter((employee: any) =>
  //       employee.name.toLowerCase().startsWith(this.nameQuery.toLowerCase()) &&
  //       employee.age.toString().startsWith(this.ageQuery) &&
  //       employee.address.toLowerCase().startsWith(this.addressQuery.toLowerCase()) &&
  //       employee.salary.toString().startsWith(this.salaryQuery)
  //     );
  // }

  refresh(){
    this.fetchAndCacheEmployees();
    this.clearSuggestions();
  }

  // ...



  async onSearchClick() {
    this.clearSuggestions();
    // if (this.nameQuery.length === 0 &&
    //   this.ageQuery.length === 0 &&
    //   this.addressQuery.length === 0
    //   && this.salaryQuery.length === 0
    // ) {
    //   this.fetchAndCacheEmployees();
    //   this.clearSuggestions();
    // }

    if (
      this.nameCache[this.nameQuery] ||
      this.ageCache[this.ageQuery] ||
      this.addressCache[this.addressQuery] ||
      this.salaryCache[this.salaryQuery]
    ) {
      // Use cached data

      const filtervalues = this.allEmployee
        .filter((employee: any) =>
          employee.name.toLowerCase().startsWith(this.nameQuery.toLowerCase()) &&
          employee.age.toString().startsWith(this.ageQuery) &&
          employee.address.toLowerCase().startsWith(this.addressQuery.toLowerCase()) &&
          employee.salary.toString().startsWith(this.salaryQuery)
        );
      if (filtervalues.length > 0) {
        console.log("cache data");
        console.log(filtervalues.length)
        this.filteredEmployees = filtervalues
        console.log(this.filteredEmployees = filtervalues)
      } else {
        console.log("want to request data")
        console.log("database requested")
        // Fetch data from the database
        const response = await this.employeeService.fetchEmployeesFromDatabase(
          this.nameQuery,
          this.ageQuery,
          this.addressQuery,
          this.salaryQuery
        ).toPromise();

        if (response.foundInDatabase) {
          // Data found in the database, update cache and display
          this.filteredEmployees = response.filteredData;
          await this.updateCacheWithFilteredData(this.filteredEmployees);
        } else {
          // Data not found in cache or database
          console.log('Data not found.');
        }
      }
    } else {
        console.log("")
    }
  }

  async updateCacheWithFilteredData(filteredData: any[]) {
    try {
      await this.employeeService.updateCache(filteredData);
      
      // Update the cache for each field
      filteredData.forEach((employee: any) => {
        this.cacheEmployeeField(employee, 'name', this.nameCache);
        this.cacheEmployeeField(employee, 'age', this.ageCache);
        this.cacheEmployeeField(employee, 'address', this.addressCache);
        this.cacheEmployeeField(employee, 'salary', this.salaryCache);
      });
      
      console.log('Cache updated with new filtered data:', filteredData);
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }
  


  clearSuggestions() {
    this.nameSuggestions = [];
    this.ageSuggestions = [];
    this.addressSuggestions = [];
    this.salarySuggestions = [];
  }



  onNameInputChange() {
    if (this.nameCache[this.nameQuery]) {
      this.nameSuggestions = this.nameCache[this.nameQuery];
    } else {
      const filteredNames = this.allEmployee
        .filter(employee => employee.name.toLowerCase().startsWith(this.nameQuery.toLowerCase()))
        .map(employee => employee.name);

      this.nameSuggestions = Array.from(new Set(filteredNames));

      this.nameCache[this.nameQuery] = Array.from(new Set(this.nameSuggestions));
    }
  }

  onAgeInputChange() {
    if (this.ageCache[this.ageQuery]) {
      this.ageSuggestions = this.ageCache[this.ageQuery];
    } else {
      const filteredAges = this.allEmployee
        .filter(employee => employee.age.toString().startsWith(this.ageQuery))
        .map(employee => employee.age.toString());

      this.ageSuggestions = Array.from(new Set(filteredAges));

      this.ageCache[this.ageQuery] = Array.from(new Set(this.ageSuggestions));
    }
  }

  onAddressInputChange() {
    if (this.addressCache[this.addressQuery]) {
      this.addressSuggestions = this.addressCache[this.addressQuery];
    } else {
      const filteredAddresses = this.allEmployee
        .filter(employee => employee.address.toLowerCase().startsWith(this.addressQuery.toLowerCase()))
        .map(employee => employee.address);

      this.addressSuggestions = Array.from(new Set(filteredAddresses));

      this.addressCache[this.addressQuery] = Array.from(new Set(this.addressSuggestions));
    }
  }

  onSalaryInputChange() {
    if (this.salaryCache[this.salaryQuery]) {
      this.salarySuggestions = this.salaryCache[this.salaryQuery];
    } else {
      const filteredSalaries = this.allEmployee
        .filter(employee => employee.salary.toString().startsWith(this.salaryQuery))
        .map(employee => employee.salary.toString());

      this.salarySuggestions = Array.from(new Set(filteredSalaries));

      this.salaryCache[this.salaryQuery] = Array.from(new Set(this.salarySuggestions));
    }
  }


  getSuggestions(query: string, field: string): string[] {
    return this.allEmployee
      .map((employee: any) => employee[field])
      .filter((value: string) => value.toLowerCase().startsWith(query.toLowerCase()))
      .sort();
  }

  onSuggestionClick(field: string, suggestion: string) {
    switch (field) {
      case 'name':
        this.nameQuery = suggestion;
        this.nameSuggestions = [];
        break;
      case 'age':
        this.ageQuery = suggestion;
        this.ageSuggestions = [];
        break;
      case 'address':
        this.addressQuery = suggestion;
        this.addressSuggestions = [];
        break;
      case 'salary':
        this.salaryQuery = suggestion;
        this.salarySuggestions = [];
        break;
    }
  }
}
