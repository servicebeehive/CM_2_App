import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private readonly STORAGE_KEY = 'user_info';
  private readonly API_BODY = 'apibody';
  private clientCode:string|null = null;
  constructor() {}

  // ✅ Save user data to localStorage
  setUserData(data: any): void {
    try {
      const jsonData:any = JSON.stringify(data);
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

  setClientCode(code:string){
    this.clientCode=code;
  }

  getClientCode():string | null{
    return this.clientCode;
  }

 GetApiBody(payload: any): any | null {
  try {
    const stored: any = localStorage.getItem(this.STORAGE_KEY);
    let headerApiBody = JSON.parse(stored);

    // 🔥 Keys you want to forcefully override
    const removeKeys = ["uname", "p_loginuser", "clientcode", "x-access-token","p_username"];

    // 🔥 Remove from incoming payload if exists
    removeKeys.forEach(key => {
      if (payload && payload.hasOwnProperty(key)) {
        delete payload[key];
      }
    });

    // 🔥 Now safely merge extra fields + payload
    const apiBody: any = {
      uname:headerApiBody?.username, //-Arushi 11 dec 2025 , 1pm -username will go into uname as per CD
      p_loginuser: headerApiBody?.username,//-Arushi 11 dec 2025 , 1pm - admin will not go if username is blank it should show error
      clientcode: this.clientCode,//-Arushi 11 dec 2025 , 1pm - CG01-SE will not go if is blank it should show error
      "x-access-token":headerApiBody?.usertoken,
    // "x-access-token" :'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyY29kZSI6ImFkbWluIiwiaWF0IjoxNzY1MjY2MDQ0LCJleHAiOjE3NjUzNTI0NDR9.ytWhv1-hYx2kbS1Ov2BkpZdgwaTsQhIw7HvjQoRdNVs',
    ...payload 
      // payload will NOT contain duplicate keys
    };
     
    return apiBody;

  } catch (error) {
    console.error("API Body Error:", error);
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
