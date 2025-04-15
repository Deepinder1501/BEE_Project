const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

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
      loginMessage.textContent = result.message || "Login failed.";
    }

  } catch (error) {
    console.error("Client login error:", error);
    loginMessage.textContent = "Something went wrong. Try again.";
  }
});
