import {
  BadRequestException,
  baseRevokeTokenKey,
  compareHash,
  ConflictException,
  createLoginCredentials,
  decryption,
  deleteKey,
  emailEmitter,
  EmailEnum,
  emailTemplate,
  encryption,
  ForbiddenRequestException,
  generateHash,
  generateOTP,
  get,
  increment,
  keys,
  NotFoundException,
  otpBlockKey,
  otpKey,
  otpMaxRequestKey,
  ProviderEnum,
  RoleEnum,
  sendEmail,
  set,
  ttl,
  uploadFile,
} from "../../common/index.js";
import {
  createOne,
  findOne,
  findOneAndUpdate,
  UserModel,
} from "../../DB/index.js";

export const verifyEmailOtp = async ({
  email,
  subject = EmailEnum.ConfirmEmail,
  title = "verify Your Account",
}) => {
  const blockKey = otpBlockKey({ email, type: subject });
  const remainBlockTimeOtp = await ttl(blockKey);
  if (remainBlockTimeOtp > 0) {
    throw ConflictException({
      message: `You have reached max request trail count please tray again after ${remainBlockTimeOtp} second`,
    });
  }
  // check max trail count
  const maxTrailCountKey = otpMaxRequestKey({ email, type: subject });
  const checkMaxOtpRequest = Number((await get(maxTrailCountKey)) || 0);

  if (checkMaxOtpRequest >= 3) {
    await set({
      key: otpBlockKey({ email, type: subject }),
      value: 0,
      ttl: 300,
    });
    throw ConflictException({
      message:
        "You have reached max request trail count please tray again after 300 second",
    });
  }

  checkMaxOtpRequest > 0
    ? await increment(maxTrailCountKey)
    : await set({ key: maxTrailCountKey, value: 1, ttl: 300 });

  const otp = await generateOTP();

  const hashedOTP = await generateHash({ plaintext: otp });

  await set({
    key: otpKey({ email, type: subject }),
    value: hashedOTP,
    ttl: 120,
  });

  await sendEmail({
    to: email,
    subject,
    html: emailTemplate({ otp, ttl: 2 * 60, title }),
  });
};

export const signup = async ({inputs , file} = {}) => {
  const { email, password, phone, username, address , role , gender } = inputs;

  const checkUserFound = await findOne({
    model: UserModel,
    filter: { email },
  });

  if (checkUserFound) {
    throw ConflictException({ message: "Email exists" });
  }

  if (role === RoleEnum.Admin || role === RoleEnum.Hospital) {
    throw ForbiddenRequestException({
      message: "غير مسموح بإنشاء حساب بهذا الدور",
    });
  }

  if (role === RoleEnum.Nurse && !file) {
    throw BadRequestException({
      message: "يجب رفع ملف PDF او Word للممرض",
    });
  }

  let nurseDocument = null;

  if (file) {
    const { secure_url, public_id } = await uploadFile({
      file,
      path: `nurse/${email}`,
    });

    nurseDocument = { secure_url, public_id };
  }


  const user = await createOne({
    model: UserModel,
    data: {
      ...inputs,
      email,
      password: await generateHash({ plaintext: password }),
      phone: await encryption(phone),
      username,
      address,
      role,
      gender,
      nurseDocument
    },
  });

  emailEmitter.emit(EmailEnum.ConfirmEmail, async () => {
    await verifyEmailOtp({ email });
  });

  return;
};

export const resendConfirmEmail = async (inputs) => {
  const { email } = inputs;
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });

  if (!account) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }

  const remainTime = await ttl(otpKey({ email }));
  if (remainTime > 0) {
    throw ConflictException({
      message: `sorry we can't provider a new otp until exists one is expire you can try again later after ${remainTime} second`,
    });
  }

  await verifyEmailOtp({ email });

  return;
};

export const requestForgotPasswordOtp = async (inputs) => {
  const { email } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.System,
    },
  });

  if (!account) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }

  const remainTime = await ttl(
    otpKey({ email, type: EmailEnum.ForgotPassword }),
  );

  if (remainTime > 0) {
    throw ConflictException({
      message: `sorry we can't provider a new otp until exists one is expire you can try again later after ${remainTime} second`,
    });
  }

  await verifyEmailOtp({
    email,
    subject: EmailEnum.ForgotPassword,
    title: "Reset Code",
  });

  return;
};

export const verifyForgotPasswordOtp = async (inputs) => {
  const { email, otp } = inputs;
  const hashOtp = await get(otpKey({ email, type: EmailEnum.ForgotPassword }));

  if (!hashOtp) {
    throw NotFoundException({ message: "Expired otp" });
  }

  const match = await compareHash({ plaintext: otp, cipherText: hashOtp });

  if (!match) {
    throw ConflictException({ message: "Invalid otp" });
  }

  return;
};

export const resetForgotPasswordOtp = async (inputs) => {
  const { email, otp, password } = inputs;

  await verifyForgotPasswordOtp({ email, otp });
  const user = await findOneAndUpdate({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.System,
    },
    update: {
      password: await generateHash({ plaintext: password }),
      changeCredentialTime: new Date(),
    },
  });

  if (!user) {
    throw NotFoundException({ message: "Account not exists" });
  }

  const tokenKeys = await keys(baseRevokeTokenKey(user._id));
  const otpKeys = await keys(otpKey({ email, type: EmailEnum.ForgotPassword }));
  await deleteKey([...tokenKeys, ...otpKeys]);

  return;
};

export const confirmEmail = async (inputs) => {
  const { email, otp } = inputs;
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });

  if (!account) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }

  const hashOtp = await get(otpKey({ email }));
  if (!hashOtp) {
    throw NotFoundException({ message: "Expired otp" });
  }

  const match = await compareHash({ plaintext: otp, cipherText: hashOtp });
  if (!match) {
    throw NotFoundException({ message: "Invalid or expired OTP" });
  }

  account.confirmEmail = new Date();
  await account.save();

  await deleteKey(await keys(otpKey({ email })));

  return { message: "Email verified successfully" };
};

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;

  const user = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.System,
    },
    select: "+password",
  });

  if (!user) {
    throw NotFoundException({ message: "invalid email or password" });
  }

  const match = await compareHash({
    plaintext: password,
    cipherText: user.password,
  });

  if (!match) {
    throw NotFoundException({ message: "invalid email or password ." });
  }

  const { access_token, refresh_token } = await createLoginCredentials(
    user,
    issuer,
  );

  return {
    access_token,
    refresh_token,
  };
};
