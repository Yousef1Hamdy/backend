import mongoose from "mongoose";
import { TypeServiceEnum } from "../../common/index.js";

const serviceSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "المستشفى مطلوب"],
    },

    name: {
      type: String,
      required: [true, "اسم الخدمة مطلوب"],
      trim: true,
      minlength: [2, "اسم الخدمة لازم يكون على الأقل حرفين"],
      maxlength: [100, "اسم الخدمة لا يزيد عن 100 حرف"],
    },

    type: {
      type: String,
      enum: Object.values(TypeServiceEnum),
      required: [true, "نوع الخدمة مطلوب"],
    },

    description: {
      type: [String],
    },

    capacity: {
      type: Number,
      min: [0, "السعة لا يمكن أن تكون أقل من 0"],
    },

  },
  {
    timestamps: true,
    versionKey: false,
    collection: "Services",
  },
);

const notifyCapacityThreshold = async ({ previousCapacity, service }) => {
  if (!service?.hospital) {
    return;
  }

  if (previousCapacity === service.capacity) {
    return;
  }

  if (service.capacity !== 3 && service.capacity !== 0) {
    return;
  }

  const { createHospitalNotification } = await import(
    "../../modules/hospitalAccountNotifications/notifications.service.js"
  );

  await createHospitalNotification({
    hospitalId: service.hospital,
    type: service.capacity === 0 ? "capacity-full" : "capacity-warning",
    title:
      service.capacity === 0
        ? `${service.name} \u0645\u0645\u062a\u0644\u0626`
        : `\u0628\u0627\u0642\u064a 3 \u0623\u0645\u0627\u0643\u0646 \u0641\u064a ${service.name}`,
    message:
      service.capacity === 0
        ? `\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0645\u0627\u0643\u0646 \u0645\u062a\u0627\u062d\u0629 \u0627\u0644\u0622\u0646 \u0641\u064a ${service.name}`
        : `\u0627\u0644\u0633\u0639\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629 \u0641\u064a ${service.name} \u0623\u0635\u0628\u062d\u062a 3`,
    route: "/hospital-account/profile/places",
    metadata: {
      serviceId: service._id,
      serviceType: service.type,
      capacity: service.capacity,
      previousCapacity,
    },
  });
};

serviceSchema.pre("save", async function capturePreviousCapacity() {
  if (this.isNew || !this.isModified("capacity")) {
    return;
  }

  const current = await this.constructor.findById(this._id)
    .select("capacity")
    .lean();

  this.$locals.previousCapacity = current?.capacity;
});

serviceSchema.post("save", async function notifyOnSave(doc) {
  if (doc.isNew || doc.$locals?.previousCapacity === undefined) {
    return;
  }

  await notifyCapacityThreshold({
    previousCapacity: doc.$locals.previousCapacity,
    service: doc,
  });
});

serviceSchema.pre("findOneAndUpdate", async function captureCapacityUpdate() {
  const update = this.getUpdate() || {};
  const capacity =
    update.capacity ??
    update.$set?.capacity;

  if (capacity === undefined) {
    return;
  }

  this.$locals = this.$locals || {};
  this.$locals.previousService = await this.model
    .findOne(this.getFilter())
    .select("capacity")
    .lean();
});

serviceSchema.post("findOneAndUpdate", async function notifyOnUpdate(doc) {
  const previousCapacity = this.$locals?.previousService?.capacity;

  if (!doc || previousCapacity === undefined) {
    return;
  }

  await notifyCapacityThreshold({
    previousCapacity,
    service: doc,
  });
});

export const ServiceModel =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);
