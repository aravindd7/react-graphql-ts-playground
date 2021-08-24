import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  // Username
  if (options.username.length <= 2) {
    return [{ field: "username", message: "the username is invalid" }];
  }

  if (options.username.includes("@")) {
    return [{ field: "username", message: "username cannot include @" }];
  }
  
  // Email
  if (!options.email.includes("@")) {
    return [{ field: "email", message: "invalid email" }];
  }

  // Password
  if (options.password.length <= 5) {
    return [
      { field: "password", message: "password length must be greater than 4" },
    ];
  }

  // If no errors are found, return null.
  return null;
};
