const form = document.getElementById('signupForm');
const message = document.getElementById('signupMessage');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstname = form.firstname.value.trim();
  const lastname = form.lastname.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const confirmPassword = form.confirmPassword.value.trim();

  // Basic validation
  if (!firstname || !lastname || !email || !password || !confirmPassword) {
    message.textContent = "All fields are required.";
    return;
  }

  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailPattern.test(email)) {
    message.textContent = "Please enter a valid email.";
    return;
  }

  if (password.length < 8) {
    message.textContent = "Password must be at least 8 characters long.";
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = "Passwords do not match.";
    return;
  }

  const userData = { firstname, lastname, email, password, confirmPassword };

  try {
    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    message.textContent = data.message;

    if (res.ok && data.redirect) {
      setTimeout(() => {
        window.location.href = data.redirect;
      }, 1000);
    }
  } catch (err) {
    console.error("Signup error:", err);
    message.textContent = "Something went wrong. Please try again.";
  }
});
