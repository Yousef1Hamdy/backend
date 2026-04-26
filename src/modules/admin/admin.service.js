import {
  ConflictException,
  NotFoundException,
  RoleEnum,
  encryption,
  generateHash,
} from "../../common/index.js";
import {
  HospitalModel,
  PartnerModel,
  ServiceModel,
  ServiceCapacityHistoryModel,
  UserModel,
  findOneAndUpdate,
} from "../../DB/index.js";

import {
  deleteModuleRecordById,
} from "../shared/module.shared.js";

const ACTIVE_WINDOW_IN_MINUTES = 15;

const roleLabelMap = {
  [RoleEnum.User]: "patients",
  [RoleEnum.Hospital]: "hospitals",
  [RoleEnum.Nurse]: "nurses",
};

const mapUsernameFields = (username) => {
  if (!username) {
    return {};
  }

  const [firstName, ...rest] = username.trim().split(/\s+/);

  return {
    firstName,
    lastName: rest.join(" ") || undefined,
  };
};

//  ADD HOSPITAL
export const addHospital = async (data) => {
  const {
    name,
    location,
    logo,
    username,
    email,
    password,
    phone,
    address,
    gender,
  } = data;

  const existingHospital = await HospitalModel.findOne({ name });
  if (existingHospital) {
    throw ConflictException({ message: "hospital already exists" });
  }

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw ConflictException({ message: "Email exists" });
  }

  const hospital = await HospitalModel.create({
    name,
    location,
  });

  const partner = await PartnerModel.create({
    name,
    logo,
    type: "hospital",
  });

  const user = await UserModel.create({
    ...mapUsernameFields(username),
    email,
    password: await generateHash({ plaintext: password }),
    phone: await encryption(phone),
    address,
    role: RoleEnum.Hospital,
    gender,
    profilePicture: logo
      ? {
          secure_url: logo,
        }
      : undefined,
    confirmEmail: new Date(),
    lastSeenAt: null,
  });

  await findOneAndUpdate({
    model: HospitalModel,
    filter: { _id: hospital._id },
    update: { accountId: user._id },
    options: { new: true, runValidators: true },
  });

  return {
    hospital: {
      ...hospital.toObject(),
      accountId: user._id,
    },
    partner,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

//  DELETE HOSPITAL
export const deleteHospital = async (id) => {
  const hospital = await HospitalModel.findById(id);

  if (!hospital) {
    throw NotFoundException({ message: "hospital not found" });
  }

  await ServiceModel.deleteMany({ hospital: id });
  await ServiceCapacityHistoryModel.deleteMany({ hospitalId: id });
  await PartnerModel.deleteOne({ name: hospital.name, type: "hospital" });

  if (hospital.accountId) {
    await UserModel.deleteOne({ _id: hospital.accountId, role: RoleEnum.Hospital });
  }

  await HospitalModel.deleteOne({ _id: id });

  return { message: "Hospital deleted" };
};

//  ADD SERVICE
export const addService = async (data) => {
  const hospital = await HospitalModel.findById(data.hospital);

  if (!hospital) {
    throw NotFoundException({ message: "hospital not found" });
  }

  return await ServiceModel.create(data);
};

//  DELETE SERVICE
export const deleteService = async (id) => {
  const service = await ServiceModel.findById(id);

  if (!service) {
    throw NotFoundException({ message: "service not found" });
  }

  await ServiceModel.deleteOne({ _id: id });
  await ServiceCapacityHistoryModel.deleteMany({ serviceId: id });

  return { message: "Service deleted" };
};

//  GET ALL USERS
export const getUsers = async (role) => {
  const filter = role === undefined ? {} : { role };
  const users = await UserModel.find(filter)
    .select("firstName lastName email role confirmEmail lastSeenAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_IN_MINUTES * 60 * 1000);
  const roleCounts = await UserModel.aggregate([
    {
      $match: {
        role: { $in: [RoleEnum.User, RoleEnum.Hospital, RoleEnum.Nurse] },
      },
    },
    {
      $group: {
        _id: "$role",
        total: { $sum: 1 },
        activeNow: {
          $sum: {
            $cond: [{ $gte: ["$lastSeenAt", activeSince] }, 1, 0],
          },
        },
      },
    },
  ]);

  const summary = Object.values(RoleEnum)
    .filter((value) =>
      [RoleEnum.User, RoleEnum.Hospital, RoleEnum.Nurse].includes(value),
    )
    .map((roleValue) => {
      const item = roleCounts.find((entry) => entry._id === roleValue);

      return {
        role: roleValue,
        label: roleLabelMap[roleValue],
        total: item?.total || 0,
        activeNow: item?.activeNow || 0,
      };
    });

  return {
    summary,
    users: users.map((user) => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isConfirmed: Boolean(user.confirmEmail),
      lastSeenAt: user.lastSeenAt || null,
      isActiveNow: Boolean(user.lastSeenAt && user.lastSeenAt >= activeSince),
      createdAt: user.createdAt,
    })),
  };
};

export const addManagedUser = async (data) => {
  const { username, email, password, phone, address, role, gender, hospitalId } = data;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw ConflictException({ message: "Email exists" });
  }

  if (role === RoleEnum.Hospital) {
    if (!hospitalId) {
      throw NotFoundException({ message: "hospitalId is required for hospital user" });
    }

    const hospital = await HospitalModel.findById(hospitalId);
    if (!hospital) {
      throw NotFoundException({ message: "hospital not found" });
    }

    if (hospital.accountId) {
      throw ConflictException({ message: "hospital already linked to an account" });
    }
  }

  const user = await UserModel.create({
    ...mapUsernameFields(username),
    email,
    password: await generateHash({ plaintext: password }),
    phone: await encryption(phone),
    address,
    role,
    gender,
    confirmEmail: new Date(),
    lastSeenAt: null,
  });

  if (role === RoleEnum.Hospital && hospitalId) {
    await findOneAndUpdate({
      model: HospitalModel,
      filter: { _id: hospitalId },
      update: { accountId: user._id },
      options: { new: true, runValidators: true },
    });
  }

  return {
    _id: user._id,
    username: `${user.firstName} ${user.lastName || ""}`.trim(),
    email: user.email,
    role: user.role,
    hospitalId: hospitalId || null,
  };
};

export const updateHospital = async (id, data) => {
  const hospital = await HospitalModel.findById(id);

  if (!hospital) {
    throw NotFoundException({ message: "hospital not found" });
  }

  const hospitalUpdate = {};

  if (data.name && data.name !== hospital.name) {
    const existingHospital = await HospitalModel.findOne({
      name: data.name,
      _id: { $ne: id },
    });

    if (existingHospital) {
      throw ConflictException({ message: "hospital already exists" });
    }

    hospitalUpdate.name = data.name;
  }

  if (data.location) {
    hospitalUpdate.location = data.location;
  }

  let updatedHospital = hospital;
  if (Object.keys(hospitalUpdate).length) {
    updatedHospital = await findOneAndUpdate({
      model: HospitalModel,
      filter: { _id: id },
      update: hospitalUpdate,
      options: { new: true, runValidators: true },
    });
  }

  let partner = await PartnerModel.findOne({ name: hospital.name, type: "hospital" });
  const partnerUpdate = {};

  if (data.name) {
    partnerUpdate.name = data.name;
  }

  if (data.logo) {
    partnerUpdate.logo = data.logo;
  }

  if (partner && Object.keys(partnerUpdate).length) {
    partner = await PartnerModel.findOneAndUpdate(
      { _id: partner._id },
      partnerUpdate,
      { new: true, runValidators: true },
    );
  }

  let user = null;
  if (hospital.accountId) {
    user = await UserModel.findById(hospital.accountId);
  }

  if (user) {
    if (data.email && data.email !== user.email) {
      const existingUser = await UserModel.findOne({
        email: data.email,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        throw ConflictException({ message: "Email exists" });
      }
    }

    const userUpdate = {
      ...mapUsernameFields(data.username),
    };

    if (data.email) userUpdate.email = data.email;
    if (data.phone) userUpdate.phone = await encryption(data.phone);
    if (data.address) userUpdate.address = data.address;
    if (data.gender !== undefined) userUpdate.gender = data.gender;
    if (data.logo) {
      userUpdate.profilePicture = {
        secure_url: data.logo,
      };
    }
    if (data.password) {
      userUpdate.password = await generateHash({ plaintext: data.password });
    }

    if (Object.keys(userUpdate).length) {
      user = await findOneAndUpdate({
        model: UserModel,
        filter: { _id: user._id },
        update: userUpdate,
        options: { new: true, runValidators: true },
      });
    }
  }

  return {
    hospital: updatedHospital,
    partner,
    user: user
      ? {
          _id: user._id,
          username: `${user.firstName} ${user.lastName || ""}`.trim(),
          email: user.email,
          role: user.role,
        }
      : null,
  };
};

export const updateService = async (id, data) => {
  if (data.hospital) {
    const hospital = await HospitalModel.findById(data.hospital);

    if (!hospital) {
      throw NotFoundException({ message: "hospital not found" });
    }
  }

  const service = await findOneAndUpdate({
    model: ServiceModel,
    filter: { _id: id },
    update: data,
    options: { new: true, runValidators: true },
  });

  if (!service) {
    throw NotFoundException({ message: "service not found" });
  }

  return service;
};

export const updateManagedUser = async (id, data) => {
  const user = await UserModel.findById(id);

  if (!user) {
    throw NotFoundException({ message: "user not found" });
  }

  if (user.role === RoleEnum.Admin) {
    throw ConflictException({ message: "admin accounts cannot be edited here" });
  }

  if (data.email && data.email !== user.email) {
    const existingUser = await UserModel.findOne({
      email: data.email,
      _id: { $ne: id },
    });

    if (existingUser) {
      throw ConflictException({ message: "Email exists" });
    }
  }

  const nextRole = data.role ?? user.role;
  const update = {
    ...mapUsernameFields(data.username),
  };

  if (data.email) update.email = data.email;
  if (data.phone) update.phone = await encryption(data.phone);
  if (data.address) update.address = data.address;
  if (data.gender !== undefined) update.gender = data.gender;
  if (data.role !== undefined) update.role = data.role;
  if (data.password) {
    update.password = await generateHash({ plaintext: data.password });
  }

  if (nextRole === RoleEnum.Hospital) {
    const targetHospitalId = data.hospitalId;

    if (!targetHospitalId) {
      throw NotFoundException({ message: "hospitalId is required for hospital user" });
    }

    const hospital = await HospitalModel.findById(targetHospitalId);
    if (!hospital) {
      throw NotFoundException({ message: "hospital not found" });
    }

    if (hospital.accountId && String(hospital.accountId) !== String(user._id)) {
      throw ConflictException({ message: "hospital already linked to another account" });
    }

    await HospitalModel.updateMany(
      { accountId: user._id, _id: { $ne: targetHospitalId } },
      { $unset: { accountId: 1 } },
    );

    await findOneAndUpdate({
      model: HospitalModel,
      filter: { _id: targetHospitalId },
      update: { accountId: user._id },
      options: { new: true, runValidators: true },
    });
  } else if (user.role === RoleEnum.Hospital || data.role !== undefined) {
    await HospitalModel.updateMany(
      { accountId: user._id },
      { $unset: { accountId: 1 } },
    );
  }

  const updatedUser = await findOneAndUpdate({
    model: UserModel,
    filter: { _id: id },
    update,
    options: { new: true, runValidators: true },
  });

  return {
    _id: updatedUser._id,
    username: `${updatedUser.firstName} ${updatedUser.lastName || ""}`.trim(),
    email: updatedUser.email,
    role: updatedUser.role,
    address: updatedUser.address || null,
  };
};

//  DELETE USER
export const deleteUser = async (id) => {
  const user = await UserModel.findById(id);

  if (!user) {
    throw NotFoundException({ message: "user not found" });
  }

  if (user.role === RoleEnum.Admin) {
    throw ConflictException({ message: "admin accounts cannot be deleted here" });
  }

  if (user.role === RoleEnum.Hospital) {
    await HospitalModel.updateMany(
      { accountId: user._id },
      { $unset: { accountId: 1 } },
    );
  }

  return await deleteModuleRecordById(UserModel, id);
};
