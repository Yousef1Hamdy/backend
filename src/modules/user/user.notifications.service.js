import { NotFoundException } from "../../common/index.js";
import { NotificationModel } from "../../DB/index.js";

const userNotificationStreams = new Map();

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

const emitUserNotificationEvent = (userId, event, payload) => {
  const listeners = userNotificationStreams.get(String(userId));

  if (!listeners?.size) {
    return;
  }

  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const response of listeners) {
    response.write(data);
  }
};

export const subscribeToUserNotifications = async (userId, res) => {
  const key = String(userId);

  if (!userNotificationStreams.has(key)) {
    userNotificationStreams.set(key, new Set());
  }

  userNotificationStreams.get(key).add(res);

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      userId: key,
      connectedAt: new Date().toISOString(),
    })}\n\n`,
  );
};

export const unsubscribeFromUserNotifications = (userId, res) => {
  const key = String(userId);
  const listeners = userNotificationStreams.get(key);

  if (!listeners) {
    return;
  }

  listeners.delete(res);

  if (!listeners.size) {
    userNotificationStreams.delete(key);
  }
};

export const createUserNotification = async ({
  userId,
  type,
  title,
  message,
  route,
  metadata = {},
} = {}) => {
  const notification = await NotificationModel.create({
    userId,
    type,
    title,
    message,
    route,
    metadata,
  });

  emitUserNotificationEvent(userId, "notification.created", {
    notification: serializeNotification(notification),
  });

  return notification;
};

export const getUserNotifications = async (userId) => {
  const notifications = await NotificationModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const unreadCount = await NotificationModel.countDocuments({
    userId,
    isRead: false,
  });

  return {
    unreadCount,
    totalCount: notifications.length,
    notifications: notifications.map(serializeNotification),
  };
};

export const getUserUnreadNotificationsCount = async (userId) =>
  await NotificationModel.countDocuments({
    userId,
    isRead: false,
  });

export const markUserNotificationAsRead = async (userId, notificationId) => {
  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: notificationId,
      userId,
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

  emitUserNotificationEvent(userId, "notification.read", {
    notification: serializeNotification(notification),
  });

  return notification;
};

export const markAllUserNotificationsAsRead = async (userId) => {
  const readAt = new Date();

  await NotificationModel.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt },
  );

  emitUserNotificationEvent(userId, "notification.readAll", {
    userId: String(userId),
    readAt: readAt.toISOString(),
  });

  return { message: "all notifications marked as read" };
};
