const ecomWidgets = [
    {
        id: 1,
        cardColor: "primary",
        label: "Briquette Available",
        badge: "ri-stack-line",
        badgeClass: "success",
        percentage: "Current",
        counter: 0,
        link: "View inventory",
        bgcolor: "primary",
        icon: "bx bx-package", // Represents stock/bundles
        decimals: 2,
        prefix: "",
        suffix: " kgs"
    },
    {
        id: 2,
        cardColor: "secondary",
        label: "Fuel Available",
        badge: "ri-oil-line",
        badgeClass: "info",
        percentage: "Current",
        counter: 0,
        link: "View fuel logs",
        bgcolor: "info",
        icon: "bx bx-gas-pump", 
        decimals: 2,
        prefix: "",
        separator: ",",
        suffix: " L"
    },
    {
        id: 3,
        cardColor: "success",
        label: "Total Consumed Briquette",
        badge: "ri-line-chart-line",
        badgeClass: "warning",
        percentage: "MTD", 
        counter: 0,
        link: "See report",
        bgcolor: "success",
        icon: "bx bx-archive-out", 
        decimals: 2,
        prefix: "",
        suffix: " kgs"
    },
    {
        id: 4,
        cardColor: "info",
        label: "Total Consumed Fuel",
        badge: "ri-flashlight-line",
        badgeClass: "danger",
        percentage: "MTD",
        counter: 0,
        link: "See report",
        bgcolor: "warning",
        icon: "bx bx-droplet", 
        decimals: 2,
        prefix: "",
        suffix: " L"
    },
];

export { ecomWidgets };