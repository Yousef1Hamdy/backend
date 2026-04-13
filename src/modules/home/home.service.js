import {
  UserModel,
  ServiceModel,
  PartnerModel,
  BookingModel
} from "../../DB/index.js";

import { findById, find } from "../../DB/index.js";

export const getHomeData = async (userId) => {

  //  USER
  const user = await findById({
    model: UserModel,
    id: userId,
    select: "firstName lastName profilePicture"
  });

  //  SERVICES 
  const services = await find({
    model: ServiceModel,
    select: "name type",
    options: { limit: 3 }
  });

  //  PARTNERS
  const partners = await find({
    model: PartnerModel,
    select: "name logo",
    options: { limit: 10 }
  });

  // STATS 
  const totalUsers = await UserModel.countDocuments();
  const totalBookings = await BookingModel.countDocuments();

  const stats = {
    users: totalUsers,
    orders: totalBookings 
  };

  return {
    user,
    services,
    partners,
    stats
  };
};