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

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toUtcStartOfDay = (value = new Date()) => {
  const date = new Date(value);

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const shiftUtcDays = (value, days) =>
  new Date(toUtcStartOfDay(value).getTime() + days * DAY_IN_MS);

const formatDateKey = (value) => {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

const formatArabicWeekday = (value) =>
  new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(value));

const normalizeStatus = (booking, decisionState) =>
  decisionState?.status || booking.status || BookingEnum.Pending;

const buildDateContext = (dateInput) => {
  const selectedDay = dateInput ? toUtcStartOfDay(dateInput) : toUtcStartOfDay();
  const nextDay = shiftUtcDays(selectedDay, 1);
  const capacityAsOf = new Date(nextDay.getTime() - 1);
  const weekStart = shiftUtcDays(selectedDay, -6);
  const nextMonth = new Date(
    Date.UTC(
      selectedDay.getUTCFullYear(),
      selectedDay.getUTCMonth() + 1,
      1,
    ),
  );
  const monthWindowStart = new Date(
    Date.UTC(
      selectedDay.getUTCFullYear(),
      selectedDay.getUTCMonth() - 5,
      1,
    ),
  );

  return {
    selectedDay,
    nextDay,
    capacityAsOf,
    weekStart,
    nextMonth,
    monthWindowStart,
    selectedDateKey: formatDateKey(selectedDay),
  };
};

const buildEmptyTypeTotals = () =>
  Object.values(TypeServiceEnum).reduce((accumulator, type) => {
    accumulator[type] = {
      total: 0,
      pending: 0,
      confirmed: 0,
      refused: 0,
    };

    return accumulator;
  }, {});

const buildCapacitySummary = (placeGroups) => ({
  totalCapacity: placeGroups.reduce(
    (sum, group) => sum + (group.totalCapacity || 0),
    0,
  ),
  childcareCapacity:
    placeGroups.find((group) => group.key === "childcare")?.totalCapacity || 0,
  healthcareCapacity:
    placeGroups.find((group) => group.key === "healthcare")?.totalCapacity || 0,
});

const buildWeeklyBuckets = ({ services, weeklyBookings, weekStart }) => {
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const day = shiftUtcDays(weekStart, index);
    return {
      date: formatDateKey(day),
      dayLabel: formatArabicWeekday(day),
      counts: services.reduce((accumulator, service) => {
        accumulator[service._id.toString()] = 0;
        return accumulator;
      }, {}),
    };
  });

  const bucketByDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));

  for (const item of weeklyBookings) {
    const bucket = bucketByDate.get(item._id.date);
    const serviceId = item._id.serviceId?.toString();

    if (!bucket || !serviceId) {
      continue;
    }

    bucket.counts[serviceId] = item.total;
  }

  return buckets;
};

const buildWeeklyReservationsChart = ({ services, weeklyBookings, weekStart }) => {
  const buckets = buildWeeklyBuckets({ services, weeklyBookings, weekStart });

  return {
    labels: buckets.map((bucket) => bucket.dayLabel),
    dates: buckets.map((bucket) => bucket.date),
    series: services.map((service) => ({
      serviceId: service._id,
      name: service.name,
      type: service.type,
      data: buckets.map((bucket) => bucket.counts[service._id.toString()] || 0),
    })),
  };
};

const buildSectionOccupancyChart = ({ serviceStatsMap, placeGroups }) => {
  const orderedServices = placeGroups.flatMap((group) =>
    group.services.map((service) => ({
      serviceId: service._id.toString(),
      name: service.name,
      type: service.type,
      groupKey: group.key,
      availableCapacity: service.capacity ?? 0,
      occupied:
        serviceStatsMap.get(service._id.toString())?.totalBookings || 0,
    })),
  );

  return {
    labels: orderedServices.map((service) => service.name),
    services: orderedServices,
    series: [
      {
        key: "occupied",
        label: "occupied",
        data: orderedServices.map((service) => service.occupied),
      },
      {
        key: "available",
        label: "available",
        data: orderedServices.map((service) => service.availableCapacity),
      },
    ],
  };
};

export const getHospitalAccountHome = async (hospitalId, { date } = {}) => {
  const hospital = await ensureHospitalExists(hospitalId);
  const dateContext = buildDateContext(date);

  const services = await find({
    model: ServiceModel,
    filter: { hospital: hospitalId },
    select: "name type capacity description createdAt",
    options: { lean: true },
  });

  const selectedDayFilter = {
    date: {
      $gte: dateContext.selectedDay,
      $lt: dateContext.nextDay,
    },
  };

  const [
    selectedBookings,
    weeklyBookings,
    monthlyBookings,
    recentNotifications,
    unreadNotifications,
    placeGroups,
  ] = await Promise.all([
    loadHospitalBookings(hospitalId, selectedDayFilter),
    BookingModel.aggregate([
      {
        $match: {
          hospitalId: hospital._id,
          date: {
            $gte: dateContext.weekStart,
            $lt: dateContext.nextDay,
          },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
                timezone: "UTC",
              },
            },
            serviceId: "$serviceId",
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]),
    BookingModel.aggregate([
      {
        $match: {
          hospitalId: hospital._id,
          date: {
            $gte: dateContext.monthWindowStart,
            $lt: dateContext.nextMonth,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
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
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    NotificationModel.find({ hospitalId }).sort({ createdAt: -1 }).limit(5).lean(),
    NotificationModel.countDocuments({
      hospitalId,
      isRead: false,
    }),
    getHospitalPlacesGroups(hospitalId, { asOfDate: dateContext.capacityAsOf }),
  ]);

  const decisionStatesMap = await loadDecisionStateMap(
    hospitalId,
    selectedBookings.map((booking) => booking._id),
  );

  const selectedReservations = await Promise.all(
    selectedBookings.map((booking) =>
      mapReservation(booking, decisionStatesMap.get(String(booking._id))),
    ),
  );

  const statusTotals = {
    [BookingEnum.Pending]: 0,
    [BookingEnum.Confirmed]: 0,
    refused: 0,
  };
  const typeTotals = buildEmptyTypeTotals();
  const serviceStatsMap = new Map(
    services.map((service) => [
      service._id.toString(),
      {
        serviceId: service._id,
        name: service.name,
        type: service.type,
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        refusedBookings: 0,
      },
    ]),
  );

  for (const booking of selectedBookings) {
    const decisionState = decisionStatesMap.get(String(booking._id));
    const status = normalizeStatus(booking, decisionState);
    const type = booking.serviceId?.type || booking.serviceType || null;
    const serviceId = booking.serviceId?._id?.toString() || booking.serviceId?.toString();

    if (Object.hasOwn(statusTotals, status)) {
      statusTotals[status] += 1;
    }

    if (type && typeTotals[type]) {
      typeTotals[type].total += 1;

      if (status === BookingEnum.Pending) {
        typeTotals[type].pending += 1;
      } else if (status === BookingEnum.Confirmed) {
        typeTotals[type].confirmed += 1;
      } else if (status === "refused") {
        typeTotals[type].refused += 1;
      }
    }

    if (serviceId && serviceStatsMap.has(serviceId)) {
      const serviceStats = serviceStatsMap.get(serviceId);
      serviceStats.totalBookings += 1;

      if (status === BookingEnum.Pending) {
        serviceStats.pendingBookings += 1;
      } else if (status === BookingEnum.Confirmed) {
        serviceStats.confirmedBookings += 1;
      } else if (status === "refused") {
        serviceStats.refusedBookings += 1;
      }
    }
  }

  const cards = hospitalTypeCards.map((card) => ({
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

  const capacitySummary = buildCapacitySummary(placeGroups);
  const weeklyReservationsChart = buildWeeklyReservationsChart({
    services,
    weeklyBookings,
    weekStart: dateContext.weekStart,
  });
  const sectionOccupancyChart = buildSectionOccupancyChart({
    serviceStatsMap,
    placeGroups,
  });

  return {
    hospital,
    filter: {
      date: dateContext.selectedDateKey,
    },
    overview: {
      totalServices: services.length,
      totalBookings: selectedBookings.length,
      pendingBookings: statusTotals[BookingEnum.Pending],
      confirmedBookings: statusTotals[BookingEnum.Confirmed],
      refusedBookings: statusTotals.refused,
    },
    cards,
    availablePlaces: placeGroups,
    capacitySummary,
    bookingOptions: cards.map((option) => ({
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
    requests: selectedReservations.slice(0, 6),
    charts: {
      weeklyReservations: weeklyReservationsChart,
      dailySectionOccupancy: sectionOccupancyChart,
    },
    analytics: {
      bookingsByStatus: [
        {
          status: BookingEnum.Pending,
          count: statusTotals[BookingEnum.Pending],
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
      occupancyByService: Array.from(serviceStatsMap.values()),
      currentCapacityByService: placeGroups.flatMap((group) =>
        group.services.map((service) => ({
          ...service,
          groupKey: group.key,
          groupTitle: group.title,
        })),
      ),
      weeklyBookings: weeklyReservationsChart.dates.map((dateValue, index) => ({
        date: dateValue,
        dayLabel: weeklyReservationsChart.labels[index],
        services: weeklyReservationsChart.series.map((series) => ({
          serviceId: series.serviceId,
          name: series.name,
          type: series.type,
          bookings: series.data[index],
        })),
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

  return {
    _id: updatedService._id,
    name: updatedService.name,
    type: updatedService.type,
    capacity: updatedService.capacity,
  };
};
