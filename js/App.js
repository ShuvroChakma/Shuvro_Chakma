/* ============================================
   APP.JS — shared behaviour across all pages
   (nav menu, scroll reveal, back-to-top,
   footer year, profile photo sync)
   ============================================ */

(function () {
  "use strict";

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
      var expanded = links.classList.contains("open");
      toggle.setAttribute("aria-expanded", expanded);
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
      });
    });
  }

  /* ---- Footer year ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Back to top button ---- */
  var backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    window.addEventListener("scroll", function () {
      backToTop.classList.toggle("visible", window.scrollY > 480);
    });
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---- Profile photo sync ----
     The admin panel stores the profile photo as a base64 data URL
     under localStorage key "portfolio_profile_photo".
     Any page with an element [data-profile-photo] gets it applied. */
  function applyProfilePhoto() {
    var photo = localStorage.getItem("portfolio_profile_photo");
    var frame = document.querySelector("[data-profile-photo]");
    if (!frame) return;

    if (photo) {
      frame.innerHTML = '<img src="' + photo + '" alt="Profile photo">';
    }
    // If nothing saved yet, the placeholder markup already in the HTML stays.
  }
  applyProfilePhoto();

  /* Keep in sync if photo is changed in admin panel in another tab */
  window.addEventListener("storage", function (e) {
    if (e.key === "portfolio_profile_photo") applyProfilePhoto();
  });

  /* ---- Contact form validation (contact section, any page) ---- */
  var form = document.querySelector("#contact-form");
  if (form) {
    var success = document.querySelector("#contact-success");

    function setError(id, msg) {
      var el = form.querySelector('[data-error-for="' + id + '"]');
      if (el) el.textContent = msg || "";
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var message = form.querySelector("#message");
      var valid = true;

      if (!name.value.trim()) {
        setError("name", "Please enter your name.");
        valid = false;
      } else setError("name", "");

      if (!email.value.trim()) {
        setError("email", "Please enter your email.");
        valid = false;
      } else if (!isValidEmail(email.value.trim())) {
        setError("email", "Please enter a valid email address.");
        valid = false;
      } else setError("email", "");

      if (!message.value.trim() || message.value.trim().length < 10) {
        setError("message", "Message should be at least 10 characters.");
        valid = false;
      } else setError("message", "");

      if (!valid) return;

      // Submit to Formspree (see the HTML comment above the form for setup steps).
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            if (success) {
              success.classList.remove("form-error-banner");
              success.classList.add("show");
              success.textContent = "Thanks! Your message has been sent. I'll get back to you soon.";
              setTimeout(function () { success.classList.remove("show"); }, 6000);
            }
          } else {
            return response.json().then(function (data) {
              throw new Error((data && data.errors && data.errors[0] && data.errors[0].message) || "Something went wrong.");
            });
          }
        })
        .catch(function () {
          if (success) {
            success.classList.add("show", "form-error-banner");
            success.textContent = "Couldn't send your message right now. Please email me directly instead.";
            setTimeout(function () { success.classList.remove("show", "form-error-banner"); }, 8000);
          }
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        });
    });
  }
})();