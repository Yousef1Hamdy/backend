import { BadRequestException, NotFoundException } from "../../common/index.js";
import { BookingNurseModel, find, findById, findByIdAndDelete, findByIdAndUpdate, paginate, UserModel } from "../../DB/index.js";

// ==========================================
export const addBooking = async (inputs, userId) => {
  const user = await findById({
    model: UserModel,
    id: userId,
  });

  if (!user) {
    throw NotFoundException({ message: "User not found" });
  }

  const booking = await BookingNurseModel.create({
    ...inputs,
    userId,
    status: "pending",
  });

  return booking;
};
// 1️⃣ Get Booking By Id
export const getBookingById = async (bookingId) => {
  const booking = await findById({
    model: BookingNurseModel,
    id: bookingId,
    options: {
      populate: [{ path: "patient", select: "name phone email" }],
    },
  });

  if (!booking) {
    throw NotFoundException({ message: "Booking not found" });
  }

  return booking;
};

// 2️⃣ Get All Bookings (Admin)
export const getAllBookings = async (query) => {
  const { page, size, status, serviceType } = query;

  const filter = {};

  if (status) filter.status = status;
  if (serviceType) filter.serviceType = serviceType;

  const bookings = await paginate({
    model: BookingNurseModel,
    filter,
    page,
    size,
    options: {
      populate: [{ path: "patient", select: "firstName lastName phone" }],
      sort: { createdAt: -1 },
    },
  });

  return bookings;
};

// 3️⃣ Get My Bookings (المريض يشوف حجوزاته)
export const getMyBookings = async (userId) => {
  const bookings = await find({
    model: BookingNurseModel,
    filter: { userId },
    options: {
      populate: [{ path: "patient", select: "firstName lastName phone" }],
    },
  });

  return bookings;
};

// ✅ 4️⃣ Update Booking
// ⚠️ المريض يعدل فقط قبل القبول.

export const updateBooking = async (bookingId, userId, inputs) => {
  const booking = await findById({
    model: BookingNurseModel,
    id: bookingId,
  });

  if (!booking) {
    throw NotFoundException({ message: "Booking not found" });
  }

  if (booking.userId.toString() !== userId.toString()) {
    throw BadRequestException({ message: "Unauthorized" });
  }

  if (booking.status !== "pending") {
    throw BadRequestException({
      message: "Cannot update booking after acceptance",
    });
  }

  const updatedBooking = await findByIdAndUpdate({
    model: BookingNurseModel,
    id: bookingId,
    update: inputs,
  });

  return updatedBooking;
};

// ✅ 5️⃣ Delete Booking

export const deleteBooking = async (bookingId, userId) => {
  const booking = await findById({
    model: BookingNurseModel,
    id: bookingId,
  });

  if (!booking) {
    throw NotFoundException({ message: "Booking not found" });
  }

  if (booking.userId.toString() !== userId.toString()) {
    throw BadRequestException({ message: "Unauthorized" });
  }

  if (booking.status !== "pending") {
    throw BadRequestException({
      message: "Cannot delete booking after acceptance",
    });
  }

  await findByIdAndDelete({
    model: BookingNurseModel,
    id: bookingId,
  });

  return {
    message: "Booking deleted successfully",
  };
};
