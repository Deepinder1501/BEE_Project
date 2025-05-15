document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector("#contactForm");

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = contactForm.querySelector('input[name="name"]').value.trim();
    const email = contactForm.querySelector('input[name="email"]').value.trim();
    const message = contactForm.querySelector('textarea[name="message"]').value.trim();

    if (!name || !email || !message) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, message })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Your message has been sent successfully!");
        contactForm.reset();
      } else {
        alert(result.error || "Failed to send your message. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
  });
});
