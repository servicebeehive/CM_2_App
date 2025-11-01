import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private readonly STORAGE_KEY = 'user_info';

  constructor() {}

  // ✅ Save user data to localStorage
  setUserData(data: any): void {
    try {
      const jsonData = JSON.stringify(data);
      localStorage.setItem(this.STORAGE_KEY, jsonData);
      console.log('User data saved to localStorage ✅');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // ✅ Get full user data
  getUserData(): any | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  // ✅ Get a single field (e.g., username)
  getField(fieldName: string): any {
    const data = this.getUserData();
    return data ? data[fieldName] : null;
  }

  // ✅ Check login status
  isLoggedIn(): boolean {
    const data = this.getUserData();
    return !!data?.usertoken;
  }

  // ✅ Clear all stored user data (on logout)
  clearUserData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('User data cleared ❌');
  }
}
