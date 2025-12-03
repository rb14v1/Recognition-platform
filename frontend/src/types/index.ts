export interface Manager {
  id: number;
  name: string;
}

export interface LoginResponse {
  access: string;  // Changed 'token' to 'access' to match Django SimpleJWT default
  refresh: string; // Added refresh token
  role: "EMPLOYEE" | "COORDINATOR" | "COMMITTEE" | "ADMIN"; // Match Django Models uppercase
  username: string;
}