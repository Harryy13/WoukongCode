const vl = require('validator');

const validate = (data) => {
    const required = ['firstname', 'emailId', 'password'];

    const isValid = required.every((k) =>
        Object.keys(data).includes(k)
    );

    if (!isValid) {
        throw new Error('Missing required fields');
    }

    if (!vl.isEmail(data.emailId)) {
        throw new Error('Invalid email format');
    }

    if (!vl.isStrongPassword(data.password)) {
        throw new Error('Weak password');
    }
};

module.exports = validate;


