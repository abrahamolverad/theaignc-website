/**
 * The AIgnc - Theme Handler
 * Dark mode is the default (Avant Media style)
 * Light mode available via toggle
 */

(function() {
    'use strict';

    const THEME_KEY = 'theaignc-theme';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';

    // Get saved theme or default to dark (Avant Media style)
    function getSavedTheme() {
        return localStorage.getItem(THEME_KEY) || DARK_THEME;
    }

    // Save theme preference
    function saveTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
    }

    // Apply theme to document
    // Dark is default (no attribute), Light requires data-theme="light"
    function applyTheme(theme) {
        if (theme === LIGHT_THEME) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        updateToggleButtons(theme);
    }

    // Update all toggle buttons on the page
    function updateToggleButtons(theme) {
        const toggleButtons = document.querySelectorAll('.theme-toggle');
        toggleButtons.forEach(btn => {
            const moonIcon = btn.querySelector('.fa-moon');
            const sunIcon = btn.querySelector('.fa-sun');
            if (moonIcon && sunIcon) {
                // In dark mode, show sun (to switch to light)
                // In light mode, show moon (to switch to dark)
                if (theme === DARK_THEME) {
                    moonIcon.style.display = 'none';
                    sunIcon.style.display = 'block';
                } else {
                    moonIcon.style.display = 'block';
                    sunIcon.style.display = 'none';
                }
            }
        });
    }

    // Toggle between themes
    function toggleTheme() {
        const currentTheme = getSavedTheme();
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        saveTheme(newTheme);
        applyTheme(newTheme);
    }

    // Initialize theme on page load
    function initTheme() {
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);

        // Set up toggle button click handlers
        document.addEventListener('click', function(e) {
            if (e.target.closest('.theme-toggle')) {
                e.preventDefault();
                toggleTheme();
            }
        });
    }

    // Apply theme immediately (before DOM ready) to prevent flash
    const savedTheme = getSavedTheme();
    if (savedTheme === LIGHT_THEME) {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

    // Expose for manual control if needed
    window.TheAIgncTheme = {
        toggle: toggleTheme,
        setDark: () => { saveTheme(DARK_THEME); applyTheme(DARK_THEME); },
        setLight: () => { saveTheme(LIGHT_THEME); applyTheme(LIGHT_THEME); },
        isDark: () => getSavedTheme() === DARK_THEME
    };
})();
