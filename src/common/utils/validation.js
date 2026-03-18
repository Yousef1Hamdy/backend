import joi from "joi";
import { Types } from "mongoose";

export const generalValidationFields = {
  email: joi
    .string()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 3,
      tlds: { allow: ["com", "net", "edu"] },
    })
    .pattern(/^[^\s@]+@([a-zA-Z0-9-]+\.){1,2}(com|net|edu)$/)
    .required()
    .messages({
      "string.base": "البريد الإلكتروني لازم يكون نص",
      "string.empty": "البريد الإلكتروني مطلوب",
      "string.email":
        "البريد الإلكتروني غير صالح أو لازم ينتهي بـ com أو net أو edu",
      "string.pattern.base": "صيغة البريد الإلكتروني غير صحيحة",
      "any.required": "البريد الإلكتروني مطلوب",
    }),

  password: joi
    .string()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    )
    .required()
    .messages({
      "string.base": "كلمة المرور لازم تكون نص",
      "string.empty": "كلمة المرور مطلوبة",
      "string.pattern.base":
        "كلمة المرور لازم تحتوي على حرف كبير وصغير ورقم ورمز خاص",
      "any.required": "كلمة المرور مطلوبة",
    }),

  username: joi
    .string()
    .pattern(/^[A-Za-z][a-z]+ [A-Za-z][a-z]+$/)
    .required()
    .messages({
      "string.base": "اسم المستخدم لازم يكون نص",
      "string.empty": "اسم المستخدم مطلوب",
      "string.pattern.base": "لازم تكتب الاسم الأول واسم العائلة",
      "any.required": "اسم المستخدم مطلوب",
    }),

  otp: joi
    .string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "رمز التحقق لازم يكون 6 أرقام",
      "any.required": "رمز التحقق مطلوب",
    }),

  phone: joi
    .string()
    .pattern(/^(20|2|\+2)?01[0-25]\d{8}$/)
    .required()
    .messages({
      "string.pattern.base": "رقم الهاتف غير صحيح",
      "any.required": "رقم الهاتف مطلوب",
    }),

  confirmPassword: (path = "password") =>
    joi.string().valid(joi.ref(path)).required().messages({
      "any.only": "تأكيد كلمة المرور غير متطابق",
      "any.required": "تأكيد كلمة المرور مطلوب",
    }),

  id: joi.string().custom((value, helper) => {
    return Types.ObjectId.isValid(value)
      ? value
      : helper.message("المعرف (ID) غير صحيح");
  }),

  address: joi
    .string()
    .min(5)
    .max(200)
    .pattern(/^[a-zA-Z0-9\u0600-\u06FF\s,.\-#\/]+$/)
    .trim()
    .required()
    .messages({
      "string.base": "العنوان لازم يكون نص",
      "string.empty": "العنوان مطلوب",
      "string.min": "العنوان لازم يكون على الأقل 5 حروف",
      "string.max": "العنوان لا يزيد عن 200 حرف",
      "string.pattern.base": "العنوان يحتوي على حروف غير مسموح بها",
      "any.required": "العنوان مطلوب",
    }),

  nameHospital: joi.string().min(3).max(100).required().messages({
    "string.base": "اسم المستشفى لازم يكون نص",
    "string.empty": "اسم المستشفى مطلوب",
    "string.min": "اسم المستشفى لازم يكون على الأقل 3 حروف",
    "string.max": "اسم المستشفى لا يزيد عن 100 حرف",
    "any.required": "اسم المستشفى مطلوب",
  }),

  location: joi.object({
    city: joi.string().required().messages({
      "string.empty": "المدينة مطلوبة",
      "any.required": "المدينة مطلوبة",
    }),
  }),

  hospitalNameService: joi
    .string()
    .custom((value, helper) => {
      return Types.ObjectId.isValid(value)
        ? value
        : helper.message("المستشفى غير صالح");
    })
    .messages({
      "string.base": "المستشفى لازم يكون نص",
      "string.empty": "المستشفى مطلوب",
      "any.required": "المستشفى مطلوب",
    }),

  nameService: joi.string().min(2).max(100).required().messages({
    "string.base": "اسم الخدمة لازم يكون نص",
    "string.empty": "اسم الخدمة مطلوب",
    "string.min": "اسم الخدمة لازم يكون على الأقل حرفين",
    "string.max": "اسم الخدمة لا يزيد عن 100 حرف",
    "any.required": "اسم الخدمة مطلوب",
  }),

  typeService: joi
    .string()
    .valid("nursery", "care", "clinic")
    .required()
    .messages({
      "any.only": "نوع الخدمة غير صالح (nursery, care, clinic فقط)",
      "any.required": "نوع الخدمة مطلوب",
    }),

  descriptionService: joi.string().max(500).allow("").messages({
    "string.base": "الوصف لازم يكون نص",
    "string.max": "الوصف لا يزيد عن 500 حرف",
  }),

  capacityNersery: joi.number().min(0).messages({
    "number.base": "السعة لازم تكون رقم",
    "number.min": "السعة لا يمكن أن تكون أقل من 0",
  }),

  priceService: joi.number().min(0).required().messages({
    "number.base": "السعر لازم يكون رقم",
    "number.min": "السعر لا يمكن أن يكون أقل من 0",
    "any.required": "السعر مطلوب",
  }),
};
