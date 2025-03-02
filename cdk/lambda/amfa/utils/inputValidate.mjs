export const validateEmail = (value) => {
    if (value && (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value))) return undefined;
    return 'Please enter a valid email address';
}

export const validatePhoneNumber = (value) => {
    if (value && (/^\+(?:[0-9] ?){6,14}[0-9]$/.test(value))) return undefined;
    return 'Please enter a valid phone number';
}

export const validateTOTP = (value) => {
    if (value && /^\d{6}$/gm.test(value)) return undefined
    return 'Mobile token must be 6 characters';
}

export const validateOTP = (value) => {
    console.log('validateOTP', value)
    console.log('validateOTP result', /^\d{4,8}$/gm.test(value))
    if (value && /^\d{4,8}$/gm.test(value)) return undefined
    return 'OTP must be 4-8 characters';
}