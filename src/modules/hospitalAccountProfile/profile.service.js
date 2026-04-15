import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  compareHash,
  encryption,
  generateHash,
} from "../../common/index.js";
import {
  HospitalModel,
  UserModel,
  findOne,
  findOneAndUpdate,
} from "../../DB/index.js";
import {
  decryptPhone,
  ensureHospitalExists,
  getHospitalPlacesGroups,
} from "../hospitalAccountShared/hospitalAccount.shared.js";

export const getHospitalProfile = async (hospitalId, user) => {
  const hospital = await ensureHospitalExists(hospitalId);

  return {
    hospitalId: hospital._id,
    hospitalName: hospital.name,
    address: hospital.location?.address || null,
    city: hospital.location?.city || null,
    email: user.email,
    phone: await decryptPhone(user.phone),
    password: "********",
    placesShortcut: {
      route: "/hospital-account/profile/places",
      label: "تعديل الأماكن المتاحة",
    },
  };
};

export const getHospitalProfilePlaces = async (hospitalId) => {
  await ensureHospitalExists(hospitalId);

  return {
    hospitalId,
    placeGroups: await getHospitalPlacesGroups(hospitalId),
  };
};

export const updateHospitalProfile = async (hospitalId, user, inputs) => {
  const hospital = await ensureHospitalExists(hospitalId);
  const { hospitalName, address, city, email, phone } = inputs;

  if (hospitalName && hospitalName !== hospital.name) {
    const existingHospital = await findOne({
      model: HospitalModel,
      filter: {
        name: hospitalName,
        _id: { $ne: hospitalId },
      },
    });

    if (existingHospital) {
      throw ConflictException({ message: "hospital name already exists" });
    }
  }

  if (email && email !== user.email) {
    const existingUser = await findOne({
      model: UserModel,
      filter: {
        email,
        _id: { $ne: user._id },
      },
    });

    if (existingUser) {
      throw ConflictException({ message: "email already exists" });
    }
  }

  const hospitalUpdate = {};
  if (hospitalName) {
    hospitalUpdate.name = hospitalName;
  }

  if (address || city) {
    hospitalUpdate.location = {
      city: city || hospital.location?.city,
      address: address || hospital.location?.address,
    };
  }

  if (Object.keys(hospitalUpdate).length) {
    await findOneAndUpdate({
      model: HospitalModel,
      filter: { _id: hospitalId },
      update: hospitalUpdate,
      options: { new: true, runValidators: true },
    });
  }

  const userUpdate = {};
  if (email) {
    userUpdate.email = email;
  }

  if (phone) {
    userUpdate.phone = await encryption(phone);
  }

  let updatedUser = user;
  if (Object.keys(userUpdate).length) {
    updatedUser = await findOneAndUpdate({
      model: UserModel,
      filter: { _id: user._id },
      update: userUpdate,
      options: { new: true, runValidators: true },
    });
  }

  const updatedHospital = await ensureHospitalExists(hospitalId);

  return {
    hospitalId: updatedHospital._id,
    hospitalName: updatedHospital.name,
    address: updatedHospital.location?.address || null,
    city: updatedHospital.location?.city || null,
    email: updatedUser.email,
    phone: await decryptPhone(updatedUser.phone),
    password: "********",
    placesShortcut: {
      route: "/hospital-account/profile/places",
      label: "تعديل الأماكن المتاحة",
    },
  };
};

export const changeHospitalPassword = async (
  hospitalId,
  user,
  { currentPassword, password },
) => {
  await ensureHospitalExists(hospitalId);

  const account = await UserModel.findById(user._id).select("+password");

  if (!account) {
    throw NotFoundException({ message: "hospital account not found" });
  }

  const isMatched = await compareHash({
    plaintext: currentPassword,
    cipherText: account.password,
  });

  if (!isMatched) {
    throw BadRequestException({ message: "current password is incorrect" });
  }

  account.password = await generateHash({ plaintext: password });
  account.changeCredentialTime = new Date();
  await account.save();

  return { message: "hospital account password updated successfully" };
};
