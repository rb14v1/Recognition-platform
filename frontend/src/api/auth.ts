import axios from "axios";

export const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/auth/",
});

// LOGIN
export const loginUser = async (data: any) => {
  return API.post("login/", data);
};

// REGISTER EMPLOYEE
export const registerEmployee = async (data: any) => {
  return API.post("register/", data);
};

// GET MANAGERS
export const getManagers = async () => {
  return API.get("managers/");
};
