// import * as sha1 from 'sha1'
import { sha1 } from 'js-sha1';

export const getApti = () => {
  return (Math.random().toString(36).substring(2, 16) + Math.random().toString(36).substring(2, 16))
}

const minLength = (value) => {
  if (value && value.length >= 8) return undefined;
  return 'Password must be at least 8 characters';
}
const hasLowercase = (value) => {
  if (value && /[a-z]/.test(value)) return undefined;
  return 'Password must contain at least one lowercase letter';
}
const hasUppercase = (value) => {
  if (value && /[A-Z]/.test(value)) return undefined;
  return 'Password must contain at least one uppercase letter';
}
const hasNumber = (value) => {
  if (value && /[0-9]/.test(value)) return undefined;
  return 'Password must contain at least one number';
}
const hasSpecial = (value) => {
  if (value && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return undefined;
  return 'Password must contain at least one special character';
}
const hasSpaces = (value) => {
  if (value && / /.test(value)) return 'Password must not contain spaces';
  return undefined;
}
export const validatePassword = (value) => {
  if (minLength(value)) return minLength(value);
  if (hasLowercase(value)) return hasLowercase(value);
  if (hasUppercase(value)) return hasUppercase(value);
  if (hasNumber(value)) return hasNumber(value);
  if (hasSpecial(value)) return hasSpecial(value);
  if (hasSpaces(value)) return hasSpaces(value);
  if (value) return undefined;
  return 'Password is required';
}

export const validateEmail = (value) => {
  if (!value) return undefined;
  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) return undefined;
  return 'Please enter a valid email address';
}

export const validatePhoneNumber = (value) => {
  if (!value) return undefined;
  if (/^\+(?:[0-9] ?){6,14}[0-9]$/.test(value)) return undefined;
  return 'Please enter a valid phone number';
}

export const check_pwn_password = async (password) => {
  const sha1password = sha1(password);
  const hash = sha1password.toUpperCase().substring(0, 5);
  const tail = sha1password.toUpperCase().substring(5);
  const response = await fetch(`https://api.pwnedpasswords.com/range/${hash}`)
  const text = await response.text();

  var re = new RegExp(tail, 'i');
  return re.test(text)
}
