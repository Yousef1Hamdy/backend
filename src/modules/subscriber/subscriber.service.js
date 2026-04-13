import { SubscriberModel } from "../../DB/index.js";
import { createOne } from "../../DB/index.js";

//  subscribe user
export const subscribe = async (email) => {
  return await createOne({
    model: SubscriberModel,
    data: { email }
  });
};