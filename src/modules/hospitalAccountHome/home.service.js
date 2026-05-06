import {
  NotFoundException,
  TypeServiceEnum,
  statusEnum,
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

const CHILDCARE_TYPE_ORDER = ["normal", "nicu"];
const HEALTHCARE_TYPE_ORDER = ["icu", "ccu", "picu"];

const CHILDCARE_META = {
  normal: {
    title: "حضانات أطفال",
    shortTitle: "حضانات أطفال",
    icon: "🍼",
  },
  nicu: {
    title: "العناية المركزة لحديثي الولادة (NICU)",
    shortTitle: "NICU",
    icon: "👶",
  },
};

const HEALTHCARE_META = {
  icu: {
    title: "عناية مركزة للكبار (ICU)",
    shortTitle: "ICU",
    icon: "🏥",
  },
  ccu: {
    title: "عناية القلب (CCU)",
    shortTitle: "CCU",
    icon: "❤️",
  },
  picu: {
    title: "عناية الأطفال (PICU)",
    shortTitle: "PICU",
    icon: "👶",
  },
};

const normalizeStatus = (booking, decisionState) =>
  decisionState?.status || booking.status || statusEnum.pending;

const detectChildcareSubtype = (name = "") => {
  const lowered = name.toLowerCase();

  if (lowered.includes("nicu")) {
    return "nicu";
  }

  if (/(حديثي الولادة|مبتسرة|رعاية)/i.test(name) && !/(أطفال|اطفال|normal)/i.test(name)) {
    return "nicu";
  }

  return "normal";
};

const detectHealthcareSubtype = (name = "") => {
  const lowered = name.toLowerCase();

  if (lowered.includes("nicu")) {
    return null;
  }

  if (lowered.includes("picu")) {
    return "picu";
  }

  if (lowered.includes("ccu")) {
    return "ccu";
  }

  if (lowered.includes("icu")) {
    return "icu";
  }

  if (/(القلب)/i.test(name)) {
    return "ccu";
  }

  if (/(الأطفال|الاطفال|الفائقة للأطفال)/i.test(name)) {
    return "picu";
  }

  if (/(الكبار|عناية مركزة للكبار)/i.test(name)) {
    return "icu";
  }

  return null;
};

const detectDashboardSubtype = (service = {}) => {
  if (service.type === TypeServiceEnum.Nursery) {
    return detectChildcareSubtype(service.name);
  }

  if (service.type === TypeServiceEnum.Care) {
    return detectHealthcareSubtype(service.name);
  }

  return null;
};

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

const buildServicesMap = (services) =>
  new Map(services.map((service) => [service._id.toString(), service]));

const buildSubtypeCapacityBuckets = (services, order, detectSubtype, metaMap) => {
  const buckets = order.reduce((accumulator, key) => {
    accumulator[key] = {
      key,
      title: metaMap[key].title,
      shortTitle: metaMap[key].shortTitle,
      icon: metaMap[key].icon,
      capacity: 0,
      services: [],
    };

    return accumulator;
  }, {});

  for (const service of services) {
    const subtype = detectSubtype(service.name);

    if (!subtype || !buckets[subtype]) {
      continue;
    }

    buckets[subtype].capacity += service.capacity ?? 0;
    buckets[subtype].services.push({
      _id: service._id,
      name: service.name,
      capacity: service.capacity ?? 0,
    });
  }

  return order.map((key) => ({
    ...buckets[key],
    available: buckets[key].capacity > 0,
  }));
};

const buildDashboardPlaces = (placeGroups) => {
  const childcareServices =
    placeGroups.find((group) => group.key === "childcare")?.services || [];
  const healthcareServices =
    placeGroups.find((group) => group.key === "healthcare")?.services || [];

  const childcareItems = buildSubtypeCapacityBuckets(
    childcareServices,
    CHILDCARE_TYPE_ORDER,
    detectChildcareSubtype,
    CHILDCARE_META,
  );
  const healthcareItems = buildSubtypeCapacityBuckets(
    healthcareServices,
    HEALTHCARE_TYPE_ORDER,
    detectHealthcareSubtype,
    HEALTHCARE_META,
  );

  return {
    childcare: {
      key: "childcare",
      title: "حضانات أطفال",
      totalCapacity: childcareItems.reduce(
        (sum, item) => sum + (item.capacity || 0),
        0,
      ),
      totalServices: childcareServices.length,
      items: childcareItems,
    },
    healthcare: {
      key: "healthcare",
      title: "عناية مركزة",
      totalCapacity: healthcareItems.reduce(
        (sum, item) => sum + (item.capacity || 0),
        0,
      ),
      totalServices: healthcareServices.length,
      items: healthcareItems,
    },
  };
};

const buildSubtypeWeeklyChart = ({
  buckets,
  servicesMap,
  order,
  metaMap,
}) => {
  const series = order.map((key) => ({
    key,
    name: metaMap[key].shortTitle,
    fullName: metaMap[key].title,
    data: buckets.map(() => 0),
  }));
  const seriesMap = new Map(series.map((item) => [item.key, item]));

  buckets.forEach((bucket, index) => {
    for (const [serviceId, count] of Object.entries(bucket.counts)) {
      if (!count) {
        continue;
      }

      const service = servicesMap.get(serviceId);

      if (!service) {
        continue;
      }

      const subtype = detectDashboardSubtype(service);

      if (!subtype || !seriesMap.has(subtype)) {
        continue;
      }

      seriesMap.get(subtype).data[index] += count;
    }
  });

  return {
    labels: buckets.map((bucket) => bucket.dayLabel),
    dates: buckets.map((bucket) => bucket.date),
    series,
  };
};

const buildSubtypeOccupancyChart = ({
  groupedPlaces,
  serviceStatsMap,
}) => {
  const orderedItems = [
    ...groupedPlaces.childcare.items,
    ...groupedPlaces.healthcare.items,
  ];

  return {
    labels: orderedItems.map((item) => item.shortTitle),
    series: [
      {
        key: "occupied",
        label: "الحجوزات",
        data: orderedItems.map((item) =>
          item.services.reduce(
            (sum, service) =>
              sum +
              (serviceStatsMap.get(service._id.toString())?.totalBookings || 0),
            0,
          ),
        ),
      },
      {
        key: "available",
        label: "الأماكن المتاحة",
        data: orderedItems.map((item) => item.capacity || 0),
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
              $cond: [{ $eq: ["$status", statusEnum.pending] }, 1, 0],
            },
          },
          confirmed: {
            $sum: {
              $cond: [{ $eq: ["$status", statusEnum.confirmed] }, 1, 0],
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
    [statusEnum.pending]: 0,
    [statusEnum.confirmed]: 0,
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

      if (status === statusEnum.pending) {
        typeTotals[type].pending += 1;
      } else if (status === statusEnum.confirmed) {
        typeTotals[type].confirmed += 1;
      } else if (status === "refused") {
        typeTotals[type].refused += 1;
      }
    }

    if (serviceId && serviceStatsMap.has(serviceId)) {
      const serviceStats = serviceStatsMap.get(serviceId);
      serviceStats.totalBookings += 1;

      if (status === statusEnum.pending) {
        serviceStats.pendingBookings += 1;
      } else if (status === statusEnum.confirmed) {
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
  const weeklyBuckets = buildWeeklyBuckets({
    services,
    weeklyBookings,
    weekStart: dateContext.weekStart,
  });
  const servicesMap = buildServicesMap(services);
  const groupedPlaces = buildDashboardPlaces(placeGroups);
  const sectionOccupancyChart = buildSubtypeOccupancyChart({
    groupedPlaces,
    serviceStatsMap,
  });
  const reservationsBySection = buildSubtypeWeeklyChart({
    buckets: weeklyBuckets,
    servicesMap,
    order: [...CHILDCARE_TYPE_ORDER, ...HEALTHCARE_TYPE_ORDER],
    metaMap: {
      ...CHILDCARE_META,
      ...HEALTHCARE_META,
    },
  });

  return {
    hospital,
    filter: {
      date: dateContext.selectedDateKey,
    },
    overview: {
      totalServices: services.length,
      totalBookings: selectedBookings.length,
      pendingBookings: statusTotals[statusEnum.pending],
      confirmedBookings: statusTotals[statusEnum.confirmed],
      refusedBookings: statusTotals.refused,
      totalCapacity: capacitySummary.totalCapacity,
      childcareCapacity: capacitySummary.childcareCapacity,
      healthcareCapacity: capacitySummary.healthcareCapacity,
    },
    summaryCards: [
      {
        key: "total-bookings",
        title: "إجمالي طلبات الحجز",
        value: selectedBookings.length,
        subtitle: "طلبات اليوم",
      },
      {
        key: "childcare-capacity",
        title: "الحضانات",
        value: capacitySummary.childcareCapacity,
        subtitle: "الأماكن المتاحة",
      },
      {
        key: "healthcare-capacity",
        title: "العناية المركزة",
        value: capacitySummary.healthcareCapacity,
        subtitle: "الأماكن المتاحة",
      },
    ],
    places: groupedPlaces,
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
      weeklyReservations: {
        labels: weeklyReservationsChart.labels,
        dates: weeklyReservationsChart.dates,
        series: reservationsBySection.series,
      },
      dailySectionOccupancy: sectionOccupancyChart,
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
