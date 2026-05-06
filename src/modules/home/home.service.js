import {
  UserModel,
  PartnerModel,
  BookingModel,
} from "../../DB/index.js";
import { TypeServiceEnum } from "../../common/index.js";
import { findById, find } from "../../DB/index.js";
import { getUserUnreadNotificationsCount } from "../user/user.notifications.service.js";

export const getHomeData = async (userId) => {
  const user = await findById({
    model: UserModel,
    id: userId,
    select: "firstName lastName profilePicture",
  });

  const services = [
    {
      key: "medical-staff",
      title: "طاقم طبي",
      route: "/booking-staff",
      serviceType: TypeServiceEnum.Clinic,
    },
    {
      key: "healthcare",
      title: "عناية مركزة",
      route: "/healthcare",
      serviceType: TypeServiceEnum.Care,
    },
    {
      key: "childcare",
      title: "حضانات أطفال",
      route: "/childcare",
      serviceType: TypeServiceEnum.Nursery,
    },
  ];

  const partners = await find({
    model: PartnerModel,
    filter: { type: { $in: ["hospital", "organization"] } },
    select: "name logo",
    options: { limit: 20, sort: { type: 1, name: 1 } },
  });

  const totalUsers = await UserModel.countDocuments();
  const totalBookings = await BookingModel.countDocuments();
  const unreadNotifications = await getUserUnreadNotificationsCount(userId);

  return {
    user,
    services,
    partners,
    stats: {
      users: totalUsers,
      orders: totalBookings,
    },
    notifications: {
      unreadCount: unreadNotifications,
    },
  };
};
