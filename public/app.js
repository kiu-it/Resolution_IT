const iconMarkup = {
  computer:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 21h8m-4-4v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  monitor:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 21h8m-4-4v4m-4-9 2.5-2.5L13 12l3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  network:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="5" r="2" stroke="currentColor" stroke-width="1.6"/><circle cx="5" cy="18" r="2" stroke="currentColor" stroke-width="1.6"/><circle cx="19" cy="18" r="2" stroke="currentColor" stroke-width="1.6"/><path d="m11 7-5 9m7-9 5 9m-11 2h12" stroke="currentColor" stroke-width="1.6"/></svg>',
  camera:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8.5h3l1.5-2h7L17 8.5h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13.5" r="3.2" stroke="currentColor" stroke-width="1.6"/></svg>',
  tool:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14.5 6.5a5 5 0 0 0-6.3 6.3l-5 5a2 2 0 0 0 2.8 2.8l5-5a5 5 0 0 0 6.3-6.3l-3 3-3-3 3.2-2.8Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spark:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" fill="currentColor"/></svg>'
};

document.querySelectorAll("[data-icon]").forEach((icon) => {
  icon.innerHTML = iconMarkup[icon.dataset.icon] || "";
});

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Mở menu" : "Đóng menu");
  mainNav.classList.toggle("is-open", !isExpanded);
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Mở menu");
    mainNav.classList.remove("is-open");
  });
});

document.querySelectorAll("[data-service-link]").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector('[name="serviceId"]').value = link.dataset.serviceLink;
  });
});

const reviewTrack = document.querySelector(".review-track");
const reviewPages = [...document.querySelectorAll(".review-pagination span")];
let activeReview = 0;

function showReview(index) {
  activeReview = (index + reviewPages.length) % reviewPages.length;
  if (window.matchMedia("(max-width: 760px)").matches) {
    reviewTrack.style.transform = `translateX(-${activeReview / reviewPages.length * 100}%)`;
  } else {
    reviewTrack.style.transform = "";
  }
  reviewPages.forEach((page, pageIndex) => {
    page.classList.toggle("review-pagination__active", pageIndex === activeReview);
  });
}

document.querySelector("[data-review-prev]").addEventListener("click", () => {
  showReview(activeReview - 1);
});
document.querySelector("[data-review-next]").addEventListener("click", () => {
  showReview(activeReview + 1);
});
window.addEventListener("resize", () => showReview(activeReview));

document.querySelector("#current-year").textContent = new Date().getFullYear();

const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const submitButton = contactForm.querySelector('button[type="submit"]');

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;

  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(formData.entries());
  formStatus.textContent = "";
  formStatus.removeAttribute("data-state");
  submitButton.disabled = true;
  submitButton.querySelector("span:first-child").textContent = "Đang gửi yêu cầu...";

  try {
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Chưa thể gửi yêu cầu.");

    formStatus.dataset.state = "success";
    formStatus.textContent = result.message;
    contactForm.reset();
  } catch (error) {
    formStatus.dataset.state = "error";
    formStatus.textContent =
      error instanceof TypeError
        ? "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại."
        : error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span:first-child").textContent = "Gửi yêu cầu tư vấn";
  }
});
