const API_BASE_URL = "http://localhost:5000/api";

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");
const termsModal = document.getElementById("termsModal");

function showMessage(message, type = "error") {
    if (!registerMessage) return;
    registerMessage.textContent = message;
    registerMessage.style.color = type === "success" ? "green" : "#d62828";
}

function clearMessage() {
    showMessage("");
}

function validateForm() {
    const firstName = document.getElementById("firstName")?.value.trim() || "";
    const lastName = document.getElementById("lastName")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const phone = document.getElementById("phone")?.value.trim() || "";
    const password = document.getElementById("password")?.value.trim() || "";
    const confirmPassword = document.getElementById("confirmPassword")?.value.trim() || "";
    const terms = document.getElementById("terms")?.checked || false;

    if (!firstName) {
        return { valid: false, message: "Please enter first name." };
    }

    if (!lastName) {
        return { valid: false, message: "Please enter last name." };
    }

    if (!email) {
        return { valid: false, message: "Please enter email address." };
    }

    if (!phone) {
        return { valid: false, message: "Please enter phone number." };
    }

    if (!password) {
        return { valid: false, message: "Please enter password." };
    }

    if (!confirmPassword) {
        return { valid: false, message: "Please enter confirm password." };
    }

    const namePattern = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;

    if (!namePattern.test(firstName)) {
        return { valid: false, message: "First name should contain only letters and spaces." };
    }

    if (!namePattern.test(lastName)) {
        return { valid: false, message: "Last name should contain only letters and spaces." };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(email)) {
        return { valid: false, message: "Please enter a valid email address." };
    }

    const phonePattern = /^[6-9][0-9]{9}$/;
    if (!phonePattern.test(phone)) {
        return { valid: false, message: "Please enter a valid 10-digit phone number starting with 6 to 9." };
    }

    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordPattern.test(password)) {
        return {
            valid: false,
            message: "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character."
        };
    }

    if (password !== confirmPassword) {
        return { valid: false, message: "Passwords do not match." };
    }

    if (!terms) {
        return { valid: false, message: "Please accept Terms & Conditions." };
    }

    return {
        valid: true,
        data: {
            firstName,
            lastName,
            email,
            phone,
            password
        }
    };
}

async function handleRegister(event) {
    event.preventDefault();
    clearMessage();

    const validation = validateForm();

    if (!validation.valid) {
        showMessage(validation.message, "error");
        return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const oldText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Registering...`;

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(validation.data)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Registration failed.", "error");
            return;
        }

        showMessage("Registration successful! Redirecting to login...", "success");
        registerForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    } catch (error) {
        console.error("Registration error:", error);
        showMessage("Server error. Please try again.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = oldText;
    }
}

document.querySelectorAll(".password-field i").forEach((icon) => {
    icon.addEventListener("click", function () {
        const input = this.parentElement.querySelector("input");
        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            this.classList.remove("fa-eye");
            this.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            this.classList.remove("fa-eye-slash");
            this.classList.add("fa-eye");
        }
    });
});

function openTermsModal(event) {
    event.preventDefault();
    if (termsModal) termsModal.style.display = "flex";
}

function closeTermsModal() {
    if (termsModal) termsModal.style.display = "none";
}

window.addEventListener("click", function (e) {
    if (e.target === termsModal) {
        closeTermsModal();
    }
});

if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
}

window.openTermsModal = openTermsModal;
window.closeTermsModal = closeTermsModal;