import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export default function LanguageMenu() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const current =
    languages.find((l) => l.code === i18n.language) || languages[0];

  function changeLanguage(code) {
    i18n.changeLanguage(code);
    localStorage.setItem("language", code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    setOpen(false);
  }

  useEffect(() => {
    function onClickOutside(e) {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="langMenuWrap" ref={wrapRef}>
      <button
        type="button"
        className="langMenuBtn"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="langFlag">{current.flag}</span>
        <span className="langName">{current.label}</span>
        <span className={`langArrow ${open ? "open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="langDropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`langOption ${i18n.language === lang.code ? "active" : ""}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="langFlag">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
