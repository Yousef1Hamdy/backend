import { ServiceCapacityHistoryModel } from "../../DB/index.js";

export const recordServiceCapacitySnapshot = async ({
  serviceId,
  hospitalId,
  capacity,
  effectiveAt = new Date(),
  source = "system",
  metadata,
} = {}) => {
  if (!serviceId || !hospitalId || capacity === undefined || capacity === null) {
    return null;
  }

  return await ServiceCapacityHistoryModel.create({
    serviceId,
    hospitalId,
    capacity,
    effectiveAt,
    source,
    metadata,
  });
};

export const getServiceCapacityMapAtDate = async ({
  hospitalId,
  serviceIds = [],
  date,
} = {}) => {
  if (!hospitalId || !serviceIds.length || !date) {
    return new Map();
  }

  const histories = await ServiceCapacityHistoryModel.aggregate([
    {
      $match: {
        hospitalId,
        serviceId: { $in: serviceIds },
        effectiveAt: { $lte: date },
      },
    },
    { $sort: { serviceId: 1, effectiveAt: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$serviceId",
        capacity: { $first: "$capacity" },
        effectiveAt: { $first: "$effectiveAt" },
      },
    },
  ]);

  return new Map(
    histories.map((item) => [
      item._id.toString(),
      {
        capacity: item.capacity,
        effectiveAt: item.effectiveAt,
      },
    ]),
  );
};
