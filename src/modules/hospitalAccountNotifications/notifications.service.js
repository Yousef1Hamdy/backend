import { NotFoundException } from "../../common/index.js";
import { NotificationModel } from "../../DB/index.js";
import { ensureHospitalExists } from "../hospitalAccountShared/hospitalAccount.shared.js";

const hospitalNotificationStreams = new Map();

const serializeNotification = (notification) => ({
  _id: notification._id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  route: notification.route || null,
  isRead: notification.isRead,
  readAt: notification.readAt || null,
  createdAt: notification.createdAt,
  metadata: notification.metadata || {},
});

const emitHospitalNotificationEvent = (hospitalId, event, payload) => {
  const listeners = hospitalNotificationStreams.get(String(hospitalId));

  if (!listeners?.size) {
    return;
  }

  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const response of listeners) {
    response.write(data);
  }
};

export const subscribeToHospitalNotifications = async (hospitalId, res) => {
  await ensureHospitalExists(hospitalId);

  const key = String(hospitalId);

  if (!hospitalNotificationStreams.has(key)) {
    hospitalNotificationStreams.set(key, new Set());
  }

  hospitalNotificationStreams.get(key).add(res);

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      hospitalId: key,
      connectedAt: new Date().toISOString(),
    })}\n\n`,
  );
};

export const unsubscribeFromHospitalNotifications = (hospitalId, res) => {
  const key = String(hospitalId);
  const listeners = hospitalNotificationStreams.get(key);

  if (!listeners) {
    return;
  }

  listeners.delete(res);

  if (!listeners.size) {
    hospitalNotificationStreams.delete(key);
  }
};

export const createHospitalNotification = async ({
  hospitalId,
  type,
  title,
  message,
  route,
  metadata = {},
} = {}) => {
  const notification = await NotificationModel.create({
    hospitalId,
    type,
    title,
    message,
    route,
    metadata,
  });

  emitHospitalNotificationEvent(hospitalId, "notification.created", {
    notification: serializeNotification(notification),
  });

  return notification;
};

export const getHospitalNotifications = async (hospitalId) => {
  await ensureHospitalExists(hospitalId);

  const notifications = await NotificationModel.find({ hospitalId })
    .sort({ createdAt: -1 })
    .lean();

  const unreadCount = await NotificationModel.countDocuments({
    hospitalId,
    isRead: false,
  });

  return {
    unreadCount,
    totalCount: notifications.length,
    notifications: notifications.map(serializeNotification),
  };
};

export const markHospitalNotificationAsRead = async (
  hospitalId,
  notificationId,
) => {
  await ensureHospitalExists(hospitalId);

  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: notificationId,
      hospitalId,
    },
    {
      isRead: true,
      readAt: new Date(),
    },
    {
      new: true,
    },
  ).lean();

  if (!notification) {
    throw NotFoundException({ message: "notification not found" });
  }

  emitHospitalNotificationEvent(hospitalId, "notification.read", {
    notification: serializeNotification(notification),
  });

  return notification;
};

export const markAllHospitalNotificationsAsRead = async (hospitalId) => {
  await ensureHospitalExists(hospitalId);

  const readAt = new Date();

  await NotificationModel.updateMany(
    { hospitalId, isRead: false },
    { isRead: true, readAt },
  );

  emitHospitalNotificationEvent(hospitalId, "notification.readAll", {
    hospitalId: String(hospitalId),
    readAt: readAt.toISOString(),
  });

  return { message: "all notifications marked as read" };
};
