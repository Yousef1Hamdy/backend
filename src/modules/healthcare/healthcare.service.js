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

const HEALTHCARE_META = {
  icu: {
    code: "ICU",
    title: "عناية مركزة للكبار (ICU)",
    icon: "🏥",
    description: [
      "حالات حرجة للكبار",
      "متابعة 24 ساعة",
      "أجهزة مراقبة مستمرة",
    ],
  },
  ccu: {
    code: "CCU",
    title: "عناية القلب (CCU)",
    icon: "❤️",
    description: [
      "حالات القلب الحرجة",
      "متابعة رسم القلب والمؤشرات الحيوية",
      "إشراف طبي متخصص",
    ],
  },
  picu: {
    code: "PICU",
    title: "عناية الأطفال (PICU)",
    icon: "👶",
    description: [
      "رعاية مركزة للأطفال",
      "متابعة التنفس والمؤشرات الحيوية",
      "إشراف طبي وتمريضي متخصص",
    ],
  },
};

const CARE_TYPE_ORDER = ["icu", "ccu", "picu"];

const careTypeMatchers = {
  icu: [
    /(^|[^a-z])icu([^a-z]|$)/i,
    /الكبار/i,
    /عناية مركزة للكبار/i,
  ],
  ccu: [
    /(^|[^a-z])ccu([^a-z]|$)/i,
    /القلب/i,
    /رعاية القلب/i,
  ],
  picu: [
    /(^|[^a-z])picu([^a-z]|$)/i,
    /الفائقة للأطفال/i,
    /الأطفال/i,
  ],
};

const preferredCarePatterns = {
  icu: [/عناية مركزة للكبار/i, /(^|[^a-z])icu([^a-z]|$)/i, /icu care room/i],
  ccu: [/رعاية القلب/i, /(^|[^a-z])ccu([^a-z]|$)/i, /ccu care room/i],
  picu: [/الفائقة للأطفال/i, /(^|[^a-z])picu([^a-z]|$)/i, /عناية الأطفال/i],
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

const detectCareType = (name = "") => {
  const lowered = name.toLowerCase();

  if (lowered.includes("nicu")) {
    return null;
  }

  if (lowered.includes("picu")) {
    return "picu";
  }

  if (lowered.includes("ccu")) {
    return "ccu";
  }

  if (lowered.includes("icu")) {
    return "icu";
  }

  return CARE_TYPE_ORDER.find((key) =>
    careTypeMatchers[key].some((matcher) => matcher.test(name)),
  ) || null;
};

const scoreServiceCandidate = (service, careType) => {
  const patterns = preferredCarePatterns[careType] || [];
  const matchedPatternIndex = patterns.findIndex((pattern) => pattern.test(service.name));

  return {
    matchedPatternIndex: matchedPatternIndex === -1 ? 999 : matchedPatternIndex,
    capacityRank: -(service.capacity ?? 0),
    createdAtRank: service.createdAt ? new Date(service.createdAt).getTime() : 0,
  };
};

const choosePreferredService = (services, careType) => {
  if (!services.length) {
    return null;
  }

  return [...services].sort((left, right) => {
    const leftScore = scoreServiceCandidate(left, careType);
    const rightScore = scoreServiceCandidate(right, careType);

    if (leftScore.matchedPatternIndex !== rightScore.matchedPatternIndex) {
      return leftScore.matchedPatternIndex - rightScore.matchedPatternIndex;
    }

    if (leftScore.capacityRank !== rightScore.capacityRank) {
      return leftScore.capacityRank - rightScore.capacityRank;
    }

    return rightScore.createdAtRank - leftScore.createdAtRank;
  })[0];
};

const buildHealthcareOptions = (services) => {
  const grouped = {
    icu: [],
    ccu: [],
    picu: [],
  };

  for (const service of services) {
    const careType = detectCareType(service.name);

    if (!careType) {
      continue;
    }

    grouped[careType].push(service);
  }

  return CARE_TYPE_ORDER.map((careType) => {
    const selectedService = choosePreferredService(grouped[careType], careType);
    const meta = HEALTHCARE_META[careType];

    if (!selectedService) {
      return {
        serviceId: null,
        type: careType,
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
      type: careType,
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

const buildHealthcareHospitalCards = async (services) => {
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
      const servicesOptions = buildHealthcareOptions(card.rawServices);

      if (!servicesOptions.length) {
        return null;
      }

      return {
        _id: card._id,
        hospitalName: card.hospitalName,
        address: card.address,
        city: card.city,
        phone: card.accountId ? phoneMap.get(card.accountId) || null : null,
        options: servicesOptions,
        capacities: {
          icu: servicesOptions.find((item) => item.type === "icu")?.capacity || 0,
          ccu: servicesOptions.find((item) => item.type === "ccu")?.capacity || 0,
          picu: servicesOptions.find((item) => item.type === "picu")?.capacity || 0,
        },
      };
    })
    .filter(Boolean);
};

const resolveHealthcareHospitalContext = async (id) => {
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
    throw NotFoundException({ message: "Hospital or healthcare service not found" });
  }

  const linkedHospital = await HospitalModel.findById(service.hospital)
    .select("name location accountId")
    .lean();

  if (!linkedHospital) {
    throw NotFoundException({ message: "Hospital not found" });
  }

  return { hospitalId: linkedHospital._id, hospital: linkedHospital };
};

export const getAllHealthcare = async () => {
  const services = await find({
    model: ServiceModel,
    filter: { type: TypeServiceEnum.Care },
    select: "name type capacity description hospital createdAt",
    options: {
      populate: [{ path: "hospital", select: "name location accountId" }],
    },
  });

  return await buildHealthcareHospitalCards(services);
};

export const getHealthcareDetails = async (id) => {
  const { hospitalId, hospital } = await resolveHealthcareHospitalContext(id);
  const services = await ServiceModel.find({
    hospital: hospitalId,
    type: TypeServiceEnum.Care,
  })
    .select("name type capacity description createdAt")
    .sort({ name: 1 })
    .lean();

  if (!services.length) {
    throw NotFoundException({ message: "No healthcare services found for this hospital" });
  }

  const [details] = await buildHealthcareHospitalCards(
    services.map((service) => ({
      ...service,
      hospital,
    })),
  );

  if (!details) {
    throw NotFoundException({ message: "No ICU/CCU/PICU services found for this hospital" });
  }

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
  };
};

export const bookHealthcare = async (userId, serviceId, details) => {
  const { hospitalId } = await resolveHealthcareHospitalContext(serviceId);
  const services = await ServiceModel.find({
    hospital: hospitalId,
    type: TypeServiceEnum.Care,
  })
    .select("name type capacity description createdAt")
    .lean();

  const options = buildHealthcareOptions(services);
  const targetOption = options.find((option) => option.type === details.careType);

  if (!targetOption?.serviceId) {
    throw NotFoundException({
      message: `Healthcare option ${details.careType} not found for this hospital`,
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
      reservationType: "healthcare",
      patientName: details.patientName,
      phone: details.phone,
      address: user?.address || null,
      condition: details.condition,
      serviceType: TypeServiceEnum.Care,
    },
  });

  const hospital = await getModuleRecordById({
    model: HospitalModel,
    id: hospitalId,
    select: "name",
  });

  return {
    hospitalName: hospital?.name,
    patientName: details.patientName,
    phone: details.phone,
    condition: details.condition,
    address: user?.address || null,
    serviceName: targetOption.title,
    careType: details.careType,
    icon: targetOption.icon,
  };
};
