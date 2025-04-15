document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.image,
        quantity: 1,
      };

      fetch("/api/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to add to cart");
          return res.json();
        })
        .then(() => alert("Product added to cart!"))
        .catch((err) => console.error("Error:", err));
    });
  });