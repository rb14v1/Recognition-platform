export interface Manager {
  id: number;
  name: string;
}


export interface LoginResponse {
  access: string;
  refresh: string;
  role: string;
  username: string;
}
export interface User {
    user_id: number;
    username: string;
    email: string;
    role: string;
    location?: string;
    employee_id: string;
    employee_dept?: string; // Optional until backend confirms
    employee_role?: string; // The Portfolio (e.g. "Developer")
    manager_name?: string;  // Placeholder for future backend update
}