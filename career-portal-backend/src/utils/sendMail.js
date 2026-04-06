const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendRecruiterInviteMail = async (email, token) => {
  try {
    console.log("Email:", email);
    console.log("Token:", token);

    if (!email) {
      throw new Error("Email is missing");
    }

    const frontendUrl = process.env.FRONTEND_URL.trim();

    const inviteLink = `${frontendUrl}/Recruiter/recruiter-signup.html?token=${token}`;

    console.log("Invite Link:", inviteLink);

    const mailOptions = {
      from: `"Gradious Careers Portal" <${process.env.EMAIL_USER}>`,
      to: email, // ✅ MUST
      subject: "Recruiter Invitation",
      html: `
        <h2>You're invited!</h2>
        <p>Click below to register:</p>
        <a href="${inviteLink}">Register</a>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");

  } catch (error) {
    console.error("Error sending recruiter invite email:", error);
  }
};

module.exports = sendRecruiterInviteMail;