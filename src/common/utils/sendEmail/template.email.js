export const emailTemplate = ({
  otp,
  ttl = 120,
  title = "Verify Your Account",
} = {}) => {
  return `
    <div style="font-family:Arial; text-align:center;">
      <h2>${title}</h2>
      <p>Your verification code is:</p>
      <div style="
        font-size:30px;
        font-weight:bold;
        letter-spacing:6px;
        color:#4f46e5;">
        ${otp}
      </div>
      <p>This code expires in ${ttl / 60} minutes.</p>
    </div>
  `;
};
