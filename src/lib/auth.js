const KEY = "emirio_token";

export function setToken(token) {
  localStorage.setItem(KEY, token);
}
export function getToken() {
  return localStorage.getItem(KEY);
}
export function clearToken() {
  localStorage.removeItem(KEY);
}
export function isLoggedIn() {
  return !!getToken();
}
