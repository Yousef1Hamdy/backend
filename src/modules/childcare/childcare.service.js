import {
  BookingModel,
  HospitalModel,
  ServiceModel,
  UserModel,
  createOne,
  find,
} from "../../DB/index.js";
import {
  NotFoundException,
  TypeServiceEnum,
  decryption,
  statusEnum,
} from "../../common/index.js";
import { getModuleRecordById } from "../shared/module.shared.js";

const CHILDCARE_TYPE_ORDER = ["normal", "nicu"];

const CHILDCARE_META = {
  normal: {
    code: "NORMAL",
    title: "حضانات أطفال",
    icon: "👶",
    description: [
      "حضانات للأطفال حديثي الولادة",
      "متابعة طبية وتمريضية أساسية",
      "رعاية يومية مستقرة",
    ],
  },
  nicu: {
    code: "NICU",
    title: "العناية المركزة لحديثي الولادة (NICU)",
    icon: "🍼",
    description: [
      "رعاية مركزة لحديثي الولادة",
      "متابعة التنفس والعلامات الحيوية",
      "إشراف طبي متخصص للحالات الحرجة",
    ],
  },
};

const nurseryMatchers = {
  nicu: [/(^|[^a-z])nicu([^a-z]|$)/i, /مبتسرة/i, /حديثي الولادة/i, /رعاية/i],
  normal: [/عادية/i, /أطفال/i, /اطفال/i, /normal/i],
};

const preferredNurseryPatterns = {
  normal: [/حضانات أطفال/i, /أطفال/i, /normal/i],
  nicu: [/nicu/i, /حديثي الولادة/i, /مبتسرة/i],
};

const decryptPhone = async (phone) => {
  if (!phone) {
    return null;
  }

  try {
    return await decryption(phone);
  } catch (error) {
    return phone;
  }
};

const detectChildcareType = (name = "") => {
  const lowered = name.toLowerCase();

  if (lowered.includes("nicu")) {
    return "nicu";
  }

  if (
    nurseryMatchers.nicu.some((matcher) => matcher.test(name)) &&
    !/(أطفال|اطفال|normal)/i.test(name)
  ) {
    return "nicu";
  }

  return "normal";
};

const scoreNurseryCandidate = (service, childcareType) => {
  const patterns = preferredNurseryPatterns[childcareType] || [];
  const matchedPatternIndex = patterns.findIndex((pattern) => pattern.test(service.name));

  return {
    matchedPatternIndex: matchedPatternIndex === -1 ? 999 : matchedPatternIndex,
    capacityRank: -(service.capacity ?? 0),
    createdAtRank: service.createdAt ? new Date(service.createdAt).getTime() : 0,
  };
};

const choosePreferredNursery = (services, childcareType) => {
  if (!services.length) {
    return null;
  }

  return [...services].sort((left, right) => {
    const leftScore = scoreNurseryCandidate(left, childcareType);
    const rightScore = scoreNurseryCandidate(right, childcareType);

    if (leftScore.matchedPatternIndex !== rightScore.matchedPatternIndex) {
      return leftScore.matchedPatternIndex - rightScore.matchedPatternIndex;
    }

    if (leftScore.capacityRank !== rightScore.capacityRank) {
      return leftScore.capacityRank - rightScore.capacityRank;
    }

    return rightScore.createdAtRank - leftScore.createdAtRank;
  })[0];
};

const buildChildcareOptions = (services) => {
  const grouped = {
    normal: [],
    nicu: [],
  };

  for (const service of services) {
    const childcareType = detectChildcareType(service.name);
    grouped[childcareType].push(service);
  }

  return CHILDCARE_TYPE_ORDER.map((childcareType) => {
    const selectedService = choosePreferredNursery(grouped[childcareType], childcareType);
    const meta = CHILDCARE_META[childcareType];

    if (!selectedService) {
      return {
        serviceId: null,
        type: childcareType,
        code: meta.code,
        title: meta.title,
        icon: meta.icon,
        description: meta.description,
        capacity: 0,
        available: false,
        availabilityText: "غير متاح",
        rawName: null,
      };
    }

    return {
      serviceId: selectedService._id,
      type: childcareType,
      code: meta.code,
      title: meta.title,
      icon: meta.icon,
      description: meta.description,
      capacity: selectedService.capacity ?? 0,
      available: (selectedService.capacity ?? 0) > 0,
      availabilityText:
        (selectedService.capacity ?? 0) > 0
          ? `${selectedService.capacity ?? 0} سرير`
          : "غير متاح",
      rawName: selectedService.name,
    };
  });
};

const buildChildcareHospitalCards = async (services) => {
  const hospitalMap = new Map();
  const accountIds = new Set();

  for (const service of services) {
    const hospital = service.hospital;

    if (!hospital?._id) {
      continue;
    }

    const hospitalId = hospital._id.toString();

    if (!hospitalMap.has(hospitalId)) {
      hospitalMap.set(hospitalId, {
        _id: hospital._id,
        hospitalName: hospital.name,
        address: hospital.location?.address || null,
        city: hospital.location?.city || null,
        accountId: hospital.accountId?.toString() || null,
        rawServices: [],
      });
    }

    if (hospital.accountId) {
      accountIds.add(hospital.accountId.toString());
    }

    hospitalMap.get(hospitalId).rawServices.push(service);
  }

  const hospitalUsers = await UserModel.find(
    { _id: { $in: Array.from(accountIds) } },
    { phone: 1 },
  ).lean();
  const phoneMap = new Map(
    await Promise.all(
      hospitalUsers.map(async (user) => [String(user._id), await decryptPhone(user.phone)]),
    ),
  );

  return Array.from(hospitalMap.values())
    .map((card) => {
      const options = buildChildcareOptions(card.rawServices);

      return {
        _id: card._id,
        hospitalName: card.hospitalName,
        address: card.address,
        city: card.city,
        phone: card.accountId ? phoneMap.get(card.accountId) || null : null,
        options,
        capacities: {
          normal: options.find((item) => item.type === "normal")?.capacity || 0,
          nicu: options.find((item) => item.type === "nicu")?.capacity || 0,
        },
        totalCapacity:
          (options.find((item) => item.type === "normal")?.capacity || 0) +
          (options.find((item) => item.type === "nicu")?.capacity || 0),
      };
    })
    .filter(Boolean);
};

const resolveChildcareHospitalContext = async (id) => {
  const hospital = await HospitalModel.findById(id)
    .select("name location accountId")
    .lean();

  if (hospital) {
    return { hospitalId: hospital._id, hospital };
  }

  const service = await ServiceModel.findById(id)
    .select("hospital")
    .lean();

  if (!service?.hospital) {
    throw NotFoundException({ message: "Hospital or childcare service not found" });
  }

  const linkedHospital = await HospitalModel.findById(service.hospital)
    .select("name location accountId")
    .lean();

  if (!linkedHospital) {
    throw NotFoundException({ message: "Hospital not found" });
  }

  return { hospitalId: linkedHospital._id, hospital: linkedHospital };
};

export const getAllChildcare = async () => {
  const services = await find({
    model: ServiceModel,
    filter: { type: TypeServiceEnum.Nursery },
    select: "name type capacity description hospital createdAt",
    options: {
      populate: [{ path: "hospital", select: "name location accountId" }],
    },
  });

  return await buildChildcareHospitalCards(services);
};

export const getChildcareDetails = async (id) => {
  const { hospitalId, hospital } = await resolveChildcareHospitalContext(id);
  const services = await ServiceModel.find({
    hospital: hospitalId,
    type: TypeServiceEnum.Nursery,
  })
    .select("name type capacity description createdAt")
    .sort({ name: 1 })
    .lean();

  if (!services.length) {
    throw NotFoundException({ message: "No childcare services found for this hospital" });
  }

  const [details] = await buildChildcareHospitalCards(
    services.map((service) => ({
      ...service,
      hospital,
    })),
  );

  return {
    _id: details._id,
    hospitalName: details.hospitalName,
    address: details.address,
    city: details.city,
    phone: details.phone,
    options: details.options,
    bookingOptions: details.options.map((option) => ({
      serviceId: option.serviceId,
      type: option.type,
      code: option.code,
      title: option.title,
      icon: option.icon,
      description: option.description,
      capacity: option.capacity,
      available: option.available,
      availabilityText: option.availabilityText,
    })),
    capacities: details.capacities,
    totalCapacity: details.totalCapacity,
  };
};

export const bookChildcare = async (userId, serviceId, details) => {
  const { hospitalId } = await resolveChildcareHospitalContext(serviceId);
  const services = await ServiceModel.find({
    hospital: hospitalId,
    type: TypeServiceEnum.Nursery,
  })
    .select("name type capacity description createdAt")
    .lean();

  const options = buildChildcareOptions(services);
  const targetOption = options.find((option) => option.type === details.type);

  if (!targetOption?.serviceId) {
    throw NotFoundException({
      message: `Childcare option ${details.type} not found for this hospital`,
    });
  }

  const user = await getModuleRecordById({
    model: UserModel,
    id: userId,
    select: "address",
    notFoundMessage: "User not found",
  });

  await createOne({
    model: BookingModel,
    data: {
      userId,
      serviceId: targetOption.serviceId,
      hospitalId,
      date: new Date(),
      status: statusEnum.pending,
      reservationType: "childcare",
      patientName: details.childName,
      phone: details.phone,
      address: user?.address || null,
      condition: details.condition,
      serviceType: TypeServiceEnum.Nursery,
    },
  });

  const hospital = await getModuleRecordById({
    model: HospitalModel,
    id: hospitalId,
    select: "name",
  });

  return {
    hospitalName: hospital?.name,
    childName: details.childName,
    phone: details.phone,
    condition: details.condition,
    type: details.type,
    address: user?.address || null,
    serviceName: targetOption.title,
    icon: targetOption.icon,
  };
};
