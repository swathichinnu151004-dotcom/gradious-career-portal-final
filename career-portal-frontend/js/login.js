function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === "password" ? "text" : "password";
}

const API_BASE_URL = "https://timocratic-sessional-lewis.ngrok-free.dev/api";

async function handleLogin(event) {
  event.preventDefault();

  const identifier = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const message = document.getElementById("loginMessage");

  message.textContent = "";
  message.style.color = "red";

  if (!identifier || !password) {
    message.textContent = "Please fill all fields.";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ identifier, password })
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.message || "Login failed";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    message.style.color = "green";
    message.textContent = "Login successful! Redirecting...";

    setTimeout(() => {
      if (data.role === "admin") {
        window.location.href = "Admin/dashboard.html";
      } else if (data.role === "recruiter") {
        window.location.href = "Recruiter/dashboard.html";
      } else if (data.role === "user") {
        window.location.href = "User/dashboard.html";
      } else {
        message.style.color = "red";
        message.textContent = "Unknown user role.";
      }
    }, 1000);
  } catch (error) {
    console.error("Login error:", error);
    message.textContent = "Server connection failed";
  }
}