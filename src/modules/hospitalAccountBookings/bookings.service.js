import { BookingEnum, NotFoundException } from "../../common/index.js";
import { BookingModel } from "../../DB/index.js";
import { HospitalAccountReservationStateModel } from "../../DB/models/hospitalAccountReservationState.model.js";
import {
  ensureHospitalExists,
  isConfirmedReservation,
  isRefusedReservation,
  loadDecisionStateMap,
  loadHospitalBookings,
  mapReservation,
  normalizeReservationType,
} from "../hospitalAccountShared/hospitalAccount.shared.js";

export const getHospitalAccountBookings = async (
  hospitalId,
  reservationType,
  bookingStatus,
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

  const matchedBookings = filteredBookings.filter((booking) => {
    const state = decisionStatesMap.get(String(booking._id));
    return bookingStatus === "accepted"
      ? isConfirmedReservation(booking, state)
      : isRefusedReservation(booking, state);
  });

  const reservations = await Promise.all(
    matchedBookings.map((booking) =>
      mapReservation(booking, decisionStatesMap.get(String(booking._id))),
    ),
  );

  return {
    reservationType,
    bookingStatus,
    totalReservations: reservations.length,
    reservations,
  };
};

export const removeAcceptedHospitalAccountReservation = async (
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
    .populate("serviceId", "type")
    .lean();

  if (!booking || !serviceTypes.includes(booking.serviceId?.type)) {
    throw NotFoundException({ message: "reservation not found" });
  }

  const decisionState = await HospitalAccountReservationStateModel.findOne({
    hospitalId,
    bookingId: reservationId,
  }).lean();

  if (!isConfirmedReservation(booking, decisionState)) {
    throw NotFoundException({ message: "accepted reservation not found" });
  }

  await HospitalAccountReservationStateModel.deleteOne({
    hospitalId,
    bookingId: reservationId,
  });

  await BookingModel.deleteOne({
    _id: reservationId,
    hospitalId,
  });

  return {
    reservationId,
    reservationType,
    removedStatus: BookingEnum.Confirmed,
    message: "accepted reservation removed successfully",
  };
};
