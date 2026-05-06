export const findById = async ({ id, options, select, model }) => {
  const doc = model.findById(id).select(select || "");
  if (options?.populate) {
    doc.populate(options.populate);
  }
  if (options?.lean) {
    doc.lean(options.lean);
  }
  return await doc.exec();
};

export const findOne = async ({
  model,
  filter = {},
  select = "",
  options = {},
} = {}) => {
  let query = model.findOne(filter).select(select);

  if (options.populate) {
    query = query.populate(options.populate);
  }

  if (options.lean) {
    query = query.lean();
  }

  if (options.sort) {
    query = query.sort(options.sort);
  }

  return await query.exec();
};

export const find = async ({ filter, options, select, model } = {}) => {
  const doc = model.find(filter || {}).select(select || "");
  if (options?.populate) {
    doc.populate(options.populate);
  }
  if (options?.skip) {
    doc.skip(options.skip);
  }

  if (options?.limit) {
    doc.limit(options.limit);
  }

  if (options?.lean) {
    doc.lean(options.lean);
  }
  return await doc.exec();
};


export const paginate = async ({
  filter = {},
  options = {},
  select,
  page = "all",
  size = 5,
  model,
} = {}) => {
  let docsCount = undefined;
  let pages = undefined;
  if (page !== "all") {
    page = Math.floor(page < 1 ? 1 : page);
    const limit = Math.floor(size < 1 || !size ? 5 : size);
    const skip = (page - 1) * limit;

    options.limit = limit;
    options.skip = skip;

    docsCount = await model.countDocuments(filter);
    pages = Math.ceil(docsCount / limit);
  }

  options.lean = options.lean ?? false;

  const result = await find({
    model,
    filter,
    select,
    options,
  });

  return {
    docsCount,
    limit: options.limit,
    pages,
    currentPage: page !== "all" ? page : undefined,
    result,
  };
};

export const create = async ({
  model,
  data = [{}],
  options = { validationBeforeSave: true },
} = {}) => {
  return await model.create(data, options);
};

export const createOne = async ({
  model,
  data = {},
  options = { validationBeforeSave: true },
} = {}) => {
  const [doc] = await create({ model, data: [data], options });
  return doc;
};

export const deleteMany = async ({ model, filter = {} } = {}) => {
  return await model.deleteMany(filter);
};

export const insertMany = async ({ data, model }) => {
  return await model.insertMany(data);
};

export const updateOne = async ({ filter, update, options, model } = {}) => {
  if (Array.isArray(update)) {
    update.push({
      $set: {
        __v: { $add: ["$__v", 1] },
      },
    });
    return await model.updateOne(filter || {}, update, {
      ...options,
      runValidators: true,
      updatePipeline: true,
    });
  }

  return await model.updateOne(
    filter || {},
    { ...update, $inc: { __v: 1 } },
    options,
  );
};

export const findOneAndUpdate = async ({
  filter,
  update,
  options,
  model,
} = {}) => {
  const normalizedOptions = { ...(options || {}) };

  if ("new" in normalizedOptions && !("returnDocument" in normalizedOptions)) {
    normalizedOptions.returnDocument = normalizedOptions.new ? "after" : "before";
    delete normalizedOptions.new;
  }

  if (Array.isArray(update)) {
    update.push({
      $set: {
        __v: { $add: ["$__v", 1] },
      },
    });
    return await model.findOneAndUpdate(filter || {}, update, {
      returnDocument: "after",
      runValidators: true,
      ...normalizedOptions,
      updatePipeline: true,
    });
  }
  return await model.findOneAndUpdate(
    filter || {},
    { ...update, $inc: { __v: 1 } },
    {
      returnDocument: "after",
      runValidators: true,
      ...normalizedOptions,
    },
  );
};

export const findByIdAndUpdate = async ({
  id,
  update,
  options = { returnDocument: "after" },
  model,
}) => {
  const normalizedOptions = { ...(options || {}) };

  if ("new" in normalizedOptions && !("returnDocument" in normalizedOptions)) {
    normalizedOptions.returnDocument = normalizedOptions.new ? "after" : "before";
    delete normalizedOptions.new;
  }

  return await model.findByIdAndUpdate(
    id,
    { ...update, $inc: { __v: 1 } },
    normalizedOptions,
  );
};

export const deleteOne = async ({ filter, model }) => {
  return await model.deleteOne(filter || {});
};

export const findOneAndDelete = async ({ filter, model } = {}) => {
  return await model.findOneAndDelete(filter || {});
};

export const findByIdAndDelete = async ({ id, model } = {}) => {

  const deletedDoc = await model.findByIdAndDelete(id);
  return deletedDoc;
};
