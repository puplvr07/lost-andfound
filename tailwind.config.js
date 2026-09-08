tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#232b4e",
                    light: "#356cbe",
                },
                secondary: "#48bdec",
                "background-light": "#f8fafc",
                body: "#334155",
                muted: "#64748b",
                subtle: "#94a3b8",
                danger: "#ef4444",
                "danger-light": "#fee2e2",
                success: "#16a34a",
                "success-light": "#dcfce7",
                "on-primary": "#ffffff",
            },
            fontFamily: {
                display: ["SFMono-Regular", "monospace"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                xl: "1rem",
            },
        },
    },
};
