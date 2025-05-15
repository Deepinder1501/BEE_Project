document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      loginMessage.textContent = "Please enter both email and password.";
      return;
    }

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.redirect) {
        localStorage.setItem("user_email", email);
        window.location.href = result.redirect;
      } else {
        loginMessage.textContent = result.message || "Invalid email or password.";
      }
    } catch (error) {
      console.error("Login request failed:", error);
      loginMessage.textContent = "Server error. Please try again later.";
    }
  });
});
