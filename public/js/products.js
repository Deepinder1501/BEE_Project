document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const product = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      image: btn.dataset.image,
      quantity: 1,
    };

    // Basic validation
    if (!product.id || !product.name || isNaN(product.price)) {
      alert("Invalid product data.");
      return;
    }

    try {
      const res = await fetch("/api/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add to cart.");
      }

      alert("Product added to cart!");
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("An error occurred while adding to cart.");
    }
  });
});
