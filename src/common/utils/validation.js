import joi from "joi";
export const generalValidationFields = {
  email: joi
    .string()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 3,
      tlds: { allow: ["com", "net", "edu"] },
    })
    .pattern(new RegExp(/^[^\s@]+@([a-zA-Z0-9-]+\.){1,2}(com|net|edu)$/))

    .messages({
      "string.base": "Email must be a string",
      "string.empty": "Email is required",
      "string.email": "Email must be valid and end with .com, .net or .edu",
      "String.pattern.base":
        "Email format is invalid (only 2-3 domain segments allowed)",
      "any.required": "Email is required",
    }),

  password: joi
    .string()
    .pattern(
      new RegExp(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      ),
    )

    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number and special character",
      "string.empty": "Password is required",
    }),

  username: joi
    .string()
    .pattern(new RegExp(/^[A-Za-z][a-z]+ [A-Za-z][a-z]+$/))

    .messages({
      "string.base": "Username must be a string",
      "string.empty": "Username is required",
      "string.pattern.base": "Username must be first and last name.",
      "any.required": "Username is required",
    }),
  otp: joi.string().pattern(new RegExp(/^\d{6}$/)),
  phone: joi.string().pattern(new RegExp(/^(20|2|\+2)?01[0-25]\d{8}$/)),
  confirmPassword: function (path = "password") {
    return joi.string().valid(joi.ref(path));
  },

  id: joi.string().custom((value, helper) => {
    return Types.ObjectId.isValid(value)
      ? true
      : helper.message("Invalid objectId");
  }),
};
