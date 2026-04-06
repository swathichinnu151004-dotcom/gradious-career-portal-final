const form = document.getElementById("forgotPasswordForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  message.style.color = "black";
  message.textContent = "Sending...";

  try {
    const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    message.style.color = "green";
    message.textContent = data.message;

  } catch (err) {
    message.style.color = "red";
    message.textContent = "Something went wrong";
  }
});