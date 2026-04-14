import { SubscriberModel } from "../../DB/index.js";
import { createModuleRecord } from "../shared/module.shared.js";

//  subscribe user
export const subscribe = async (email) => {
  return await createModuleRecord(SubscriberModel, { email });
};
