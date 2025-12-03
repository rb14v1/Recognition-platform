export interface Manager {
  id: number;
  name: string;
}

export interface LoginResponse {
  token: string;
  role: "employee" | "coordinator" | "committee" | "admin";
  username: string;
}
