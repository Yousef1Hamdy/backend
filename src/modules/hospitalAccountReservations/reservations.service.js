import { NotFoundException, statusEnum } from "../../common/index.js";
import { BookingModel } from "../../DB/index.js";
import { HospitalAccountReservationStateModel } from "../../DB/models/hospitalAccountReservationState.model.js";
import {
  ensureHospitalExists,
  loadDecisionStateMap,
  loadHospitalBookings,
  mapReservation,
  normalizeReservationType,
} from "../hospitalAccountShared/hospitalAccount.shared.js";
import { createUserNotification } from "../user/user.notifications.service.js";

export const getHospitalAccountReservations = async (
  hospitalId,
  reservationType,
) => {
  await ensureHospitalExists(hospitalId);
  const serviceTypes = normalizeReservationType(reservationType);

  const bookings = await loadHospitalBookings(hospitalId);
  const filteredBookings = bookings.filter((booking) =>
    serviceTypes.includes(booking.serviceId?.type),
  );

  const decisionStatesMap = await loadDecisionStateMap(
    hospitalId,
    filteredBookings.map((booking) => booking._id),
  );

  const pendingBookings = filteredBookings.filter((booking) => {
    const state = decisionStatesMap.get(String(booking._id));
    return !state?.status || state.status === statusEnum.pending;
  });

  const reservations = await Promise.all(
    pendingBookings.map((booking) =>
      mapReservation(booking, decisionStatesMap.get(String(booking._id))),
    ),
  );

  return {
    reservationType,
    totalReservations: reservations.length,
    reservations,
  };
};

export const getHospitalAccountReservationDetails = async (
  hospitalId,
  reservationType,
  reservationId,
) => {
  await ensureHospitalExists(hospitalId);
  const serviceTypes = normalizeReservationType(reservationType);

  const booking = await BookingModel.findOne({
    _id: reservationId,
    hospitalId,
  })
    .populate("userId", "firstName lastName phone")
    .populate("serviceId", "name type description")
    .lean();

  if (!booking || !serviceTypes.includes(booking.serviceId?.type)) {
    throw NotFoundException({ message: "reservation not found" });
  }

  const decisionState = await HospitalAccountReservationStateModel.findOne({
    hospitalId,
    bookingId: booking._id,
  }).lean();

  const reservation = await mapReservation(booking, decisionState);

  return {
    ...reservation,
    patient: {
      _id: booking.userId?._id || null,
      name: reservation.patientName,
      phone: reservation.phone,
      condition: reservation.condition,
    },
    service: {
      ...reservation.service,
      reservationType,
    },
    actions: {
      canAccept: reservation.status !== statusEnum.confirmed,
      canRefuse: reservation.status !== "refused",
    },
  };
};

export const updateHospitalAccountReservationStatus = async (
  hospitalId,
  reservationType,
  reservationId,
  action,
) => {
  const reservation = await getHospitalAccountReservationDetails(
    hospitalId,
    reservationType,
    reservationId,
  );

  const status = action === "accept" ? statusEnum.confirmed : "refused";

  const decisionState = await HospitalAccountReservationStateModel.findOneAndUpdate(
    {
      hospitalId,
      bookingId: reservationId,
    },
    {
      hospitalId,
      bookingId: reservationId,
      status,
      decisionAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  const decisionLabel = status === statusEnum.confirmed ? "قبول" : "رفض";
  const route =
    reservationType === "healthcare" || reservationType === "childcare"
      ? "/booking"
      : "/booking-staff/my";

  if (reservation.patient?._id) {
    await createUserNotification({
      userId: reservation.patient._id,
      type: "reservation-status-updated",
      title: `${decisionLabel} طلب الحجز`,
      message: `تم ${decisionLabel} طلب الحجز في ${reservation.service?.name || "الخدمة"}`,
      route,
      metadata: {
        bookingId: reservationId,
        hospitalId,
        reservationType,
        status,
        serviceName: reservation.service?.name || null,
      },
    });
  }

  return {
    reservationId,
    reservationType,
    status: decisionState.status,
    decisionAt: decisionState.decisionAt,
  };
};
