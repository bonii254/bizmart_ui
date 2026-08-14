const ecomWidgets = [
  {
    id: 1,
    cardColor: "success",
    label: "Total Sales Revenue",
    badge: "ri-arrow-up-line",
    badgeClass: "success",
    percentage: "+12.5 %", // Or "Today" / "MTD"
    counter: 0,
    link: "View sales report",
    bgcolor: "success",
    icon: "bx bx-dollar-circle", // Represents revenue / cash register
    decimals: 2,
    prefix: "$", // Replace with your currency code (e.g. "KES ", "€", "£")
    separator: ",",
    suffix: ""
  },
  {
    id: 2,
    cardColor: "primary",
    label: "Total Orders",
    badge: "ri-shopping-cart-2-line",
    badgeClass: "primary",
    percentage: "Today",
    counter: 0,
    link: "View all orders",
    bgcolor: "primary",
    icon: "bx bx-shopping-bag", // Represents retail transactions
    decimals: 0,
    prefix: "",
    separator: ",",
    suffix: " sales"
  },
  {
    id: 3,
    cardColor: "warning",
    label: "Low Stock Items",
    badge: "ri-error-warning-line",
    badgeClass: "danger",
    percentage: "Action Needed", 
    counter: 0,
    link: "View inventory",
    bgcolor: "warning",
    icon: "bx bx-package", // Represents inventory stock items
    decimals: 0,
    prefix: "",
    separator: ",",
    suffix: " items"
  },
  {
    id: 4,
    cardColor: "info",
    label: "Customers Served",
    badge: "ri-user-line",
    badgeClass: "info",
    percentage: "MTD",
    counter: 0,
    link: "View customer list",
    bgcolor: "info",
    icon: "bx bx-group", 
    decimals: 0,
    prefix: "",
    separator: ",",
    suffix: ""
  },
];

export { ecomWidgets };