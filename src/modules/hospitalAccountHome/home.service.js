import {
  BookingEnum,
  NotFoundException,
  TypeServiceEnum,
} from "../../common/index.js";
import {
  BookingModel,
  NotificationModel,
  ServiceModel,
  find,
  findOne,
  findOneAndUpdate,
} from "../../DB/index.js";
import {
  ensureHospitalExists,
  getHospitalPlacesGroups,
  hospitalTypeCards,
  loadDecisionStateMap,
  loadHospitalBookings,
  mapReservation,
} from "../hospitalAccountShared/hospitalAccount.shared.js";

export const getHospitalAccountHome = async (hospitalId) => {
  const hospital = await ensureHospitalExists(hospitalId);

  const services = await find({
    model: ServiceModel,
    filter: { hospital: hospitalId },
    select: "name type capacity description createdAt",
    options: { lean: true },
  });

  const [allBookings, bookingStats, monthlyBookings] = await Promise.all([
    loadHospitalBookings(hospitalId),
    BookingModel.aggregate([
      { $match: { hospitalId: hospital._id } },
      {
        $lookup: {
          from: "Services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: {
          path: "$service",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            status: "$status",
            type: "$service.type",
          },
          count: { $sum: 1 },
        },
      },
    ]),
    BookingModel.aggregate([
      { $match: { hospitalId: hospital._id } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", BookingEnum.Pending] }, 1, 0],
            },
          },
          confirmed: {
            $sum: {
              $cond: [{ $eq: ["$status", BookingEnum.Confirmed] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);
  const recentNotifications = await NotificationModel.find({ hospitalId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  const unreadNotifications = await NotificationModel.countDocuments({
    hospitalId,
    isRead: false,
  });

  const decisionStatesMap = await loadDecisionStateMap(
    hospitalId,
    allBookings.map((booking) => booking._id),
  );

  const recentReservations = await Promise.all(
    allBookings
      .slice(0, 6)
      .map((booking) =>
        mapReservation(booking, decisionStatesMap.get(String(booking._id))),
      ),
  );

  const statusTotals = {
    [BookingEnum.Pending]: 0,
    [BookingEnum.Confirmed]: 0,
    refused: 0,
  };

  const typeTotals = Object.values(TypeServiceEnum).reduce((accumulator, type) => {
    accumulator[type] = {
      total: 0,
      pending: 0,
      confirmed: 0,
      refused: 0,
    };

    return accumulator;
  }, {});

  for (const item of bookingStats) {
    const status = item?._id?.status;
    const type = item?._id?.type;
    const count = item?.count || 0;

    if (status && Object.hasOwn(statusTotals, status)) {
      statusTotals[status] += count;
    }

    if (type && typeTotals[type]) {
      typeTotals[type].total += count;

      if (status === BookingEnum.Pending) {
        typeTotals[type].pending += count;
      }

      if (status === BookingEnum.Confirmed) {
        typeTotals[type].confirmed += count;
      }
    }
  }

  for (const reservation of recentReservations) {
    if (reservation.status === "refused") {
      statusTotals.refused += 1;

      if (reservation.service.type && typeTotals[reservation.service.type]) {
        typeTotals[reservation.service.type].refused += 1;
        typeTotals[reservation.service.type].pending = Math.max(
          0,
          typeTotals[reservation.service.type].pending - 1,
        );
      }
    }
  }

  const reservationOptions = hospitalTypeCards.map((card) => ({
    key: card.key,
    title: card.title,
    totalBookings: card.types.reduce(
      (sum, type) => sum + (typeTotals[type]?.total || 0),
      0,
    ),
    pendingBookings: card.types.reduce(
      (sum, type) => sum + (typeTotals[type]?.pending || 0),
      0,
    ),
    confirmedBookings: card.types.reduce(
      (sum, type) => sum + (typeTotals[type]?.confirmed || 0),
      0,
    ),
    refusedBookings: card.types.reduce(
      (sum, type) => sum + (typeTotals[type]?.refused || 0),
      0,
    ),
  }));

  return {
    hospital,
    overview: {
      totalServices: services.length,
      totalBookings: allBookings.length,
      pendingBookings:
        statusTotals[BookingEnum.Pending] - statusTotals.refused,
      confirmedBookings: statusTotals[BookingEnum.Confirmed],
      refusedBookings: statusTotals.refused,
    },
    cards: reservationOptions,
    availablePlaces: await getHospitalPlacesGroups(hospitalId),
    bookingOptions: reservationOptions.map((option) => ({
      key: option.key,
      title: `${option.title} accepted`,
      totalBookings: option.confirmedBookings,
    })),
    notifications: {
      unreadCount: unreadNotifications,
      latest: recentNotifications.map((notification) => ({
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        route: notification.route || null,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      })),
    },
    requests: recentReservations,
    analytics: {
      bookingsByStatus: [
        {
          status: BookingEnum.Pending,
          count: Math.max(0, statusTotals[BookingEnum.Pending] - statusTotals.refused),
        },
        {
          status: BookingEnum.Confirmed,
          count: statusTotals[BookingEnum.Confirmed],
        },
        {
          status: "refused",
          count: statusTotals.refused,
        },
      ],
      bookingsByType: Object.entries(TypeServiceEnum).map(([typeKey, typeLabel]) => ({
        typeKey,
        typeLabel,
        count: typeTotals[typeLabel]?.total || 0,
      })),
      monthlyBookings: monthlyBookings.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        total: item.total,
        pending: item.pending,
        confirmed: item.confirmed,
      })),
    },
  };
};

export const updateHospitalAccountPlaces = async (
  hospitalId,
  serviceId,
  { capacity },
) => {
  await ensureHospitalExists(hospitalId);

  const service = await findOne({
    model: ServiceModel,
    filter: {
      _id: serviceId,
      hospital: hospitalId,
    },
  });

  if (!service) {
    throw NotFoundException({ message: "service not found for this hospital" });
  }

  const updatedService = await findOneAndUpdate({
    model: ServiceModel,
    filter: {
      _id: serviceId,
      hospital: hospitalId,
    },
    update: { capacity },
    options: { new: true, runValidators: true },
  });

  const { createHospitalNotification } = await import(
    "../hospitalAccountNotifications/notifications.service.js"
  );

  if (updatedService.capacity === 1) {
    await createHospitalNotification({
      hospitalId,
      type: "capacity-warning",
      title: `\u0628\u0627\u0642\u064a \u0645\u0643\u0627\u0646 \u0648\u0627\u062d\u062f \u0641\u064a ${updatedService.name}`,
      message: `\u0627\u0644\u0633\u0639\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629 \u0641\u064a ${updatedService.name} \u0623\u0635\u0628\u062d\u062a 1`,
      route: "/hospital-account/profile/places",
      metadata: {
        serviceId: updatedService._id,
        capacity: updatedService.capacity,
      },
    });
  }

  if (updatedService.capacity === 0) {
    await createHospitalNotification({
      hospitalId,
      type: "capacity-full",
      title: `${updatedService.name} \u0645\u0645\u062a\u0644\u0626`,
      message: `\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0645\u0627\u0643\u0646 \u0645\u062a\u0627\u062d\u0629 \u0627\u0644\u0622\u0646 \u0641\u064a ${updatedService.name}`,
      route: "/hospital-account/profile/places",
      metadata: {
        serviceId: updatedService._id,
        capacity: updatedService.capacity,
      },
    });
  }

  return {
    _id: updatedService._id,
    name: updatedService.name,
    type: updatedService.type,
    capacity: updatedService.capacity,
  };
};
