(function (theme) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  setTheme();
  function setTheme() {
    document.body.classList.toggle(
      "dark",
      {
        native: media.matches,
        dark: true,
        light: false,
      }[theme]
    );
  }
  media.addListener(setTheme);
  addEventListener("load", () => {
    const select = document.getElementById("theme");
    select.value = theme;
    select.addEventListener("input", () => {
      localStorage.setItem("theme", (theme = select.value));
      setTheme();
    });
  });
})(localStorage.getItem("theme") || "native");
