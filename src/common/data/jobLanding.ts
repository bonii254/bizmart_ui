import img1 from "../../assets/images/companies/img-1.png";
import img2 from "../../assets/images/companies/img-2.png";
import img3 from "../../assets/images/companies/img-3.png";
import img4 from "../../assets/images/companies/img-4.png";
import img5 from "../../assets/images/companies/img-5.png";
import img8 from "../../assets/images/companies/img-8.png";
import img9 from "../../assets/images/companies/img-9.png";
import img7 from "../../assets/images/companies/img-7.png";


const jobProcess = [
  {
    id: 1,
    clss: "shadow-lg",
    lable: "Register Account",
    desc: "First, You need to make a account.",
    color: "secondary"
  },
  {
    id: 2,
    lable: "Create Resume",
    desc: "Create a resume for your job.",
    color: "success "
  },
  {
    id: 3,
    lable: "Find Job",
    desc: "Search for your dream jobs from velzon.",
    color: "success "
  },
  {
    id: 4,
    lable: "Apply Job",
    desc: "Apply to the compnay and wait for interview.",
    color: "success "
  },
];

const categories = [
  {
    id: 1,
    icon: "ri-pencil-ruler-2-line fs-1",
    lable: "IT & Software",
    jobs: "1543 Jobs",
  },
  {
    id: 2,
    icon: "ri-airplay-line fs-1",
    lable: "Construction / Facilities",
    jobs: "3241 Jobs",
  },
  {
    id: 3,
    icon: "ri-bank-line fs-1",
    lable: "Government",
    jobs: "876 Jobs",
  },
  {
    id: 4,
    icon: "ri-focus-2-line fs-1",
    lable: "Marketing & Advertising",
    jobs: "465 Jobs",
  },
  {
    id: 5,
    icon: "ri-pencil-ruler-line fs-1",
    lable: "Education & training",
    jobs: "105 Jobs",
  },
  {
    id: 6,
    icon: "ri-line-chart-line fs-1",
    lable: "Digital Marketing",
    jobs: "377 Jobs",
  },
  {
    id: 7,
    icon: "ri-briefcase-2-line fs-1",
    lable: "Catering & Tourism",
    jobs: "85 Jobs",
  },
];
const findJob = [
  {
    id: 1,
    company: img3,
    lable: "UI/UX designer",
    name: "Nesta Technologies",
    location: "USA",
    salary: "$23k - 35k",
    s1: ["Design", "success"],
    s2: ["UI/UX", "danger"],
    s3: ["Adobe XD", "primary"],
    bgcolor:"warning"
  },
  {
    id: 2,
    company: img2,
    lable: "Product Sales Specialist",
    class: "active",
    name: "Digitech Galaxy",
    location: "Spain",
    salary: "$10k - 15k",
    s1: ["Sales", "primary"],
    s2: ["Product", "secondary"],
    s3: ["Bussiness", "info"],
    bgcolor:"primary"
  },
  {
    id: 3,
    company: img4,
    lable: "Marketing Director",
    class: "active",
    name: "Meta4Systems",
    location: "Sweden",
    salary: "$20k - 25k",
    s1: ["Marketing", "warning"],
    s2: ["Bussiness", "info"],
    bgcolor:"danger"
  },
  {
    id: 4,
    company: img9,
    lable: "Product Designer",
    name: "Themesbrand",
    location: "USA",
    salary: "$40k+",
    s1: ["Design", "success"],
    s2: ["UI/UX", "danger"],
    s3: ["Adobe XD", "primary"],
    bgcolor:"success"
  },
  {
    id: 5,
    company: img1,
    lable: "Project Manager",
    name: "Syntyce Solutions",
    location: "Germany",
    salary: "$18k - 26k",
    s1: ["HR", "danger"],
    s2: ["Manager", "success"],
    bgcolor:"info"
  },
  {
  id: 6,
  company: img7,
  lable: "Business Associate",
  class: "active",
  name: "Nesta Technologies",
  location: "USA",
  salary: "$41k - 45k",
  s1: ["Design", "success"],
  s2: ["UI/UX", "danger"],
  s3: ["Adob XD", "primary"],
  bgcolor:"success"
},
  {
    id: 7,
    company: img8,
    lable: "Recruiting Coordinator",
    name: "Zoetic Fashion",
    location: "Namibia",
    salary: " $12k - 15k",
    s1: ["Full Time", "success"],
    s2: ["Remote", "info"],
    s3: ["Fashion", "primary"],
    bgcolor:"info"
  },
  
  {
    id: 8,
    company: img5,
    lable: "Customs officer",
    class: "active",
    name: "Themesbrand",
    location: "USA",
    salary: "$40k+",
    s1: ["Design", "success"],
    s2: ["UI/UX", "danger"],
    s3: ["Adobe XD", "primary"],
    bgcolor:"warning"
  },

];
export { jobProcess, categories, findJob };
