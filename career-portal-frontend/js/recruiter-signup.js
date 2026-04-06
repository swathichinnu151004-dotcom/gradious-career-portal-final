const recruiterSignupForm = document.getElementById("recruiterSignupForm");
const emailInput = document.getElementById("email");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const companyNameInput = document.getElementById("companyName");
const locationInput = document.getElementById("location");
const passwordInput = document.getElementById("password");
const signupMessage = document.getElementById("signupMessage");
const togglePasswordBtn = document.getElementById("togglePassword");

const API_BASE_URL = "https://timocratic-sessional-lewis.ngrok-free.dev/api";
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

document.addEventListener("DOMContentLoaded", () => {
  validateInviteToken();
});

if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePasswordBtn.innerHTML = isPassword
      ? '<i class="fa-solid fa-eye-slash"></i>'
      : '<i class="fa-solid fa-eye"></i>';
  });
}

recruiterSignupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearMessage();

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const company_name = companyNameInput.value.trim();
  const location = locationInput.value.trim();
  const password = passwordInput.value.trim();

  if (!token) {
    showMessage("Invalid signup link. Token is missing.", "error");
    return;
  }

  if (!name || !phone || !company_name || !location || !password) {
    showMessage("Please fill all required fields.", "error");
    return;
  }

  if (!isValidName(name)) {
    showMessage("Name should contain only letters.", "error");
    return;
  }

  if (!isValidPhone(phone)) {
    showMessage("Please enter a valid 10-digit phone number.", "error");
    return;
  }

  if (!isValidLocation(location)) {
    showMessage("Location should contain only letters.", "error");
    return;
  }

  if (company_name.length < 2) {
    showMessage("Please enter a valid company name.", "error");
    return;
  }

  if (!isValidPassword(password)) {
    showMessage(
      "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character.",
      "error"
    );
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register-recruiter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        name,
        phone,
        company_name,
        location,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.message || "Recruiter registration failed.";
      showMessage(message, "error");

      if (
        message.toLowerCase().includes("already registered") ||
        message.toLowerCase().includes("already exists")
      ) {
        setTimeout(() => {
          window.location.href = "../login.html";
        }, 2000);
      }

      return;
    }

    showMessage(data.message || "Recruiter registered successfully.", "success");
    recruiterSignupForm.reset();
    emailInput.value = data.email || emailInput.value;

    setTimeout(() => {
      window.location.href = "../login.html";
    }, 2000);
  } catch (error) {
    console.error("Recruiter signup error:", error);
    showMessage("Server error while registering recruiter.", "error");
  }
});

async function validateInviteToken() {
  clearMessage();

  if (!token) {
    showMessage("Invalid signup link. Token is missing.", "error");
    disableForm();
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/validate-invite?token=${encodeURIComponent(token)}`
    );

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Invalid or expired invite link.", "error");
      disableForm();
      return;
    }

    emailInput.value = data.email || "";
    emailInput.readOnly = true;
  } catch (error) {
    console.error("Validate invite error:", error);
    showMessage("Server error while validating invite link.", "error");
    disableForm();
  }
}

function disableForm() {
  if (emailInput) emailInput.disabled = true;
  if (nameInput) nameInput.disabled = true;
  if (phoneInput) phoneInput.disabled = true;
  if (companyNameInput) companyNameInput.disabled = true;
  if (locationInput) locationInput.disabled = true;
  if (passwordInput) passwordInput.disabled = true;
  if (togglePasswordBtn) togglePasswordBtn.disabled = true;

  const submitBtn = recruiterSignupForm.querySelector(".signup-btn");
  if (submitBtn) submitBtn.disabled = true;
}

function showMessage(message, type) {
  signupMessage.textContent = message;
  signupMessage.className = `form-message ${type}`;
}

function clearMessage() {
  signupMessage.textContent = "";
  signupMessage.className = "form-message";
}

function isValidPhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}

function isValidName(name) {
  return /^[A-Za-z\s]+$/.test(name);
}

function isValidLocation(location) {
  return /^[A-Za-z\s]+$/.test(location);
}

function isValidPassword(password) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);
}