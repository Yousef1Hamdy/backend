import { BookingModel } from "../../DB/index.js";

export const getUserBookings = async (userId) => {
  return await BookingModel.find({ userId })
    .populate("hospitalId", "name location")
    .populate("serviceId", "name type")
    .sort({ createdAt: -1 });
};