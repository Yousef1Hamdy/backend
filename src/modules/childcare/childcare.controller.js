import {
  getAllChildcare,
  getChildcareDetails,
  bookChildcare
} from "./childcare.service.js";

export const getAllChildcareController = async (req, res) => {
  const data = await getAllChildcare();
  res.json({ data });
};

export const getChildcareDetailsController = async (req, res) => {
  const data = await getChildcareDetails(req.params.id);
  res.json({ data });
};

// 🔥 booking endpoint
export const bookChildcareController = async (req, res) => {
  const order = await bookChildcare(
    req.user._id,
    req.params.id
  );

  res.json({
    message: "Booked successfully",
    order
  });
};