import {
  BookingEnum,
  NotFoundException,
  TypeServiceEnum,
  decryption,
} from "../../common/index.js";
import {
  BookingModel,
  ServiceModel,
  HospitalModel,
  findOne,
  findById,
} from "../../DB/index.js";
import { HospitalAccountReservationStateModel } from "../../DB/models/hospitalAccountReservationState.model.js";

export const reservationTypeMap = {
  childcare: [TypeServiceEnum.Nursery],
  healthcare: [TypeServiceEnum.Care],
};

export const hospitalTypeCards = [
  {
    key: "childcare",
    title: "childcare reservations",
    types: reservationTypeMap.childcare,
  },
  {
    key: "healthcare",
    title: "healthcare reservations",
    types: reservationTypeMap.healthcare,
  },
];

export const ensureHospitalExists = async (hospitalId) => {
  const hospital = await findById({
    model: HospitalModel,
    id: hospitalId,
    select: "name location createdAt",
    options: { lean: true },
  });

  if (!hospital) {
    throw NotFoundException({ message: "hospital not found" });
  }

  return hospital;
};

export const getHospitalIdByAccountId = async (accountId) => {
  const hospital = await findOne({
    model: HospitalModel,
    filter: { accountId },
    select: "_id name location createdAt",
    options: { lean: true },
  });

  if (!hospital) {
    throw NotFoundException({ message: "hospital account is not linked to a hospital" });
  }

  return hospital;
};

export const loadHospitalBookings = async (hospitalId) => {
  return await BookingModel.find({ hospitalId })
    .populate("userId", "firstName lastName phone")
    .populate("serviceId", "name type description")
    .sort({ createdAt: -1 })
    .lean();
};

export const loadDecisionStateMap = async (hospitalId, bookingIds) => {
  if (!bookingIds.length) {
    return new Map();
  }

  const states = await HospitalAccountReservationStateModel.find({
    hospitalId,
    bookingId: { $in: bookingIds },
  }).lean();

  return new Map(states.map((state) => [String(state.bookingId), state]));
};

export const normalizeReservationType = (reservationType) => {
  const serviceTypes = reservationTypeMap[reservationType];

  if (!serviceTypes) {
    throw NotFoundException({ message: "reservation type not found" });
  }

  return serviceTypes;
};

export const mapReservationStatus = (booking, decisionState) => {
  if (decisionState?.status) {
    return decisionState.status;
  }

  return booking.status || BookingEnum.Pending;
};

export const isConfirmedReservation = (booking, decisionState) =>
  mapReservationStatus(booking, decisionState) === BookingEnum.Confirmed;

export const isRefusedReservation = (booking, decisionState) =>
  mapReservationStatus(booking, decisionState) === "refused";

export const decryptPhone = async (phone) => {
  if (!phone) {
    return null;
  }

  try {
    return await decryption(phone);
  } catch (error) {
    return phone;
  }
};

export const mapReservation = async (booking, decisionState) => {
  const patientName =
    `${booking.userId?.firstName || ""} ${booking.userId?.lastName || ""}`.trim() ||
    "Unknown patient";

  return {
    _id: booking._id,
    date: booking.date,
    createdAt: booking.createdAt,
    status: mapReservationStatus(booking, decisionState),
    patientName,
    phone: await decryptPhone(booking.userId?.phone),
    condition: booking.condition ?? null,
    service: {
      _id: booking.serviceId?._id || null,
      name: booking.serviceId?.name || "Unknown service",
      type: booking.serviceId?.type || null,
      description: booking.serviceId?.description || [],
    },
  };
};

export const getHospitalPlacesGroups = async (hospitalId) => {
  const services = await ServiceModel.find({ hospital: hospitalId })
    .select("name type capacity")
    .sort({ type: 1, name: 1 })
    .lean();

  return hospitalTypeCards.map((card) => ({
    key: card.key,
    title: card.key === "childcare" ? "حضانات الأطفال" : "عناية مركزة",
    services: services
      .filter((service) => card.types.includes(service.type))
      .map((service) => ({
        _id: service._id,
        name: service.name,
        type: service.type,
        capacity: service.capacity ?? 0,
      })),
  }));
};
