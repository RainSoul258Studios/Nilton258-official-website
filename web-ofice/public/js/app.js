function enterSite() {
  document.getElementById("landing-view").classList.add("hidden");
  document.getElementById("app-container").classList.remove("hidden");

  const audio = document.getElementById("global-audio-player");
  audio.volume = 0.5;
  audio.play().catch((error) => {
    console.warn("Audio playback was blocked.", error);
  });
  navigate("inicio");
}

function navigate(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section || !section.classList.contains("section-content")) {
    return;
  }

  document.querySelectorAll(".section-content").forEach((item) => {
    item.classList.toggle("active", item === section);
  });

  updateNavigationLayout(sectionId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateNavigationLayout(sectionId) {
  const nav = document.getElementById("nav-container");
  const main = document.getElementById("main-layout");
  const isHome = sectionId === "inicio";
  const useSideNavigation = !isHome && window.innerWidth > 768;
  nav.classList.toggle("nav-top", !useSideNavigation);
  nav.classList.toggle("nav-side", useSideNavigation);
  nav.classList.toggle("border-b-2", !useSideNavigation);
  nav.classList.toggle("flex-row", !useSideNavigation);
  nav.classList.toggle("items-center", !useSideNavigation);
  nav.classList.toggle("justify-center", !useSideNavigation);
  nav.classList.toggle("flex-col", useSideNavigation);
  nav.classList.toggle("items-start", useSideNavigation);
  nav.classList.toggle("justify-start", useSideNavigation);
  nav.classList.toggle("pt-12", useSideNavigation);

  nav.querySelectorAll("a").forEach((link) => {
    link.classList.toggle("w-full", useSideNavigation);
    link.classList.toggle("py-4", useSideNavigation);
    link.classList.toggle("pl-8", useSideNavigation);
    link.classList.toggle("border-b", useSideNavigation);
    link.classList.toggle("border-zinc-800", useSideNavigation);
    link.classList.toggle("no-underline", !useSideNavigation);
  });

  main.style.marginLeft = useSideNavigation ? "280px" : "auto";
  main.style.width = useSideNavigation ? "calc(100% - 280px)" : "100%";
  main.classList.toggle("mt-24", !useSideNavigation);
  main.classList.toggle("mt-8", useSideNavigation);
}

window.addEventListener("resize", () => {
  const activeSection = document.querySelector(".section-content.active");
  if (activeSection) {
    updateNavigationLayout(activeSection.id);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed.", error);
    });
  });
}
