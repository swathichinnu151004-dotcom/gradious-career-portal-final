const form = document.getElementById("resetPasswordForm");
const message = document.getElementById("message");

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  try {
    const response = await fetch("http://localhost:5000/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        newPassword,
        confirmPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      message.textContent = data.message;
      message.style.color = "green";

      setTimeout(() => {
        window.location.href = "./login.html";
      }, 2000);
    } else {
      message.textContent = data.message;
      message.style.color = "red";
    }
  } catch (error) {
    message.textContent = "Something went wrong";
    message.style.color = "red";
  }
});