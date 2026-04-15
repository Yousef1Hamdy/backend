import { decryption } from "../../common/index.js";
import { BookingModel } from "../../DB/index.js";

export const getUserBookings = async (userId) => {
  const bookings = await BookingModel.find({ userId })
    .populate("userId", "firstName lastName phone address")
    .populate("hospitalId", "name location")
    .populate("serviceId", "name type description")
    .sort({ createdAt: -1 });

  return await Promise.all(
    bookings.map(async (booking) => {
      const rawPhone = booking.phone || booking.userId?.phone || null;
      let phone = rawPhone;

      if (phone) {
        try {
          phone = await decryption(phone);
        } catch (error) {
          phone = rawPhone;
        }
      }

      const patientName =
        booking.patientName ||
        `${booking.userId?.firstName || ""} ${booking.userId?.lastName || ""}`.trim() ||
        null;

      const serviceType = booking.serviceType || booking.serviceId?.type || null;
      const reservationType =
        booking.reservationType ||
        (serviceType === "حضانات أطفال" ? "childcare" : "healthcare");

      return {
        _id: booking._id,
        date: booking.date,
        status: booking.status,
        createdAt: booking.createdAt,
        hospital: booking.hospitalId
          ? {
              _id: booking.hospitalId._id,
              name: booking.hospitalId.name,
              address: booking.hospitalId.location?.address || null,
              city: booking.hospitalId.location?.city || null,
            }
          : null,
        reservationDetails: {
          patientName,
          phone,
          address: booking.address || booking.userId?.address || null,
          condition: booking.condition || null,
          reservationType,
          serviceType,
          serviceName: booking.serviceId?.name || null,
        },
        service: booking.serviceId
          ? {
              _id: booking.serviceId._id,
              name: booking.serviceId.name,
              type: booking.serviceId.type,
              description: booking.serviceId.description || [],
            }
          : null,
      };
    }),
  );
};
