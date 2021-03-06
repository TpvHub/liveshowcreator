const checkEmptyObject = (data, feilds = []) => {
    let errors = {};
    if (typeof data !== "object") errors["object_type"] = "Data must be an object";
    else {
        errors = feilds.reduce((acc, feild) => {
            if (data[feild] === null || data[feild] === undefined || data[feild] === "") {
                acc[feild] = {
                    message: `"${feild}" must be required`,
                    name: feild
                };
            }
            return acc;
        }, errors)
    }

    if (Object.keys(errors).length > 0) return errors;
    return false;
}

const isEmail = (email = "") => {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return regex.test(email)
}

module.exports = {
    checkEmptyObject,
    isEmail
}