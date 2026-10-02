const AUTH_STORAGE_KEY = "yatri-vahan-user";
const USERS_STORAGE_KEY = "yatri-vahan-users";

export const getCurrentUser = () => {
  const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  return savedUser ? JSON.parse(savedUser) : null;
};

export const saveUser = (user) => {
  const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
  const nextUsers = users.filter((item) => item.email !== user.email);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...nextUsers, user]));
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const findUser = (email, password) => {
  const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
  return users.find(
    (user) => user.email === email.trim().toLowerCase() && user.password === password,
  );
};

export const getLoginPath = (returnTo = "/") =>
  `/login?returnTo=${encodeURIComponent(returnTo)}`;

export const logoutUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
