/* ==========================================
   PORTFOLIO MAIN JAVASCRIPT
   ANOSHA OAD
========================================== */

/* ==========================================
   TYPING EFFECT
========================================== */

const text = "FULL STACK DEVELOPER";
let index = 0;
let speed = 120;

function typeEffect(){
    const element = document.querySelector(".hero-left h2");
    if(element && index < text.length){
        element.innerHTML += text.charAt(index);
        index++;
        setTimeout(typeEffect, speed);
    }
}

window.addEventListener("load", function(){
    const heading = document.querySelector(".hero-left h2");
    if(heading){
        heading.innerHTML = "";
        typeEffect();
    }
});

/* ==========================================
   NAVBAR ACTIVE LINK
========================================== */

const navLinks = document.querySelectorAll("nav ul li a");

navLinks.forEach(link => {
    link.addEventListener("click", function(){
        navLinks.forEach(item => item.classList.remove("active"));
        this.classList.add("active");
    });
});

/* ==========================================
   SCROLL REVEAL ANIMATION
========================================== */

const revealElements = document.querySelectorAll(
    ".card, .project-box, .about-preview, .cta, .project-card, .timeline-box"
);

function revealOnScroll(){
    revealElements.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        if(elementTop < windowHeight - 100){
            element.style.opacity = "1";
            element.style.transform = "translateY(0)";
        }
    });
}

window.addEventListener("scroll", revealOnScroll);

revealElements.forEach(element => {
    element.style.opacity = "0";
    element.style.transform = "translateY(50px)";
    element.style.transition = "0.6s ease";
});

/* Run once on load in case elements are already in view */
window.addEventListener("load", revealOnScroll);

/* ==========================================
   PROFILE IMAGE EFFECT
========================================== */

const profileImage = document.querySelector(".hero-right img");

if(profileImage){
    profileImage.addEventListener("mouseenter", function(){
        this.style.transform = "scale(1.08)";
    });
    profileImage.addEventListener("mouseleave", function(){
        this.style.transform = "scale(1)";
    });
}

/* ==========================================
   CURRENT YEAR FOOTER
========================================== */

const year = document.querySelector("footer p");

if(year){
    const currentYear = new Date().getFullYear();
    year.innerHTML = "© " + currentYear + " All Rights Reserved";
}

/* ==========================================
   ADMIN LOGIN
   NOTE: this checks a hardcoded username and a password kept in
   localStorage. It never contacts app.py, so it does not use
   portfolio.db at all. Once you share app.py, replace this block
   with a fetch() call to your real Flask login route.
========================================== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function(e){
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const error = document.getElementById("error");

        const correctUsername = "Anosha Oad";
        const correctPassword = localStorage.getItem("adminPassword") || "1625";

        if(username === correctUsername && password === correctPassword){
            sessionStorage.setItem("adminLoggedIn", "true");
            window.location.href = "/admin/dashboard";
        } else {
            if(error){
                error.innerHTML = "Invalid username or password";
            }
        }
    });
}

/* ==========================================
   CHANGE PASSWORD
========================================== */

const updatePassword = document.getElementById("updatePassword");

if (updatePassword) {
    updatePassword.addEventListener("click", function () {
        const oldPassword = document.getElementById("oldPassword").value.trim();
        const newPassword = document.getElementById("newPassword").value.trim();
        const savedPassword = localStorage.getItem("adminPassword") || "1625";

        if (oldPassword !== savedPassword) {
            alert("Old password is incorrect");
            return;
        }
        if (newPassword === "") {
            alert("Please enter new password");
            return;
        }

        localStorage.setItem("adminPassword", newPassword);
        alert("Password updated successfully");

        document.getElementById("oldPassword").value = "";
        document.getElementById("newPassword").value = "";
    });
}

/* ==========================================
   PROJECT MANAGEMENT
   NOTE: reads/writes only to localStorage in this browser. Once
   app.py is shared, swap this block for fetch() calls to your
   /api/projects routes so it persists to portfolio.db.
========================================== */

let projects = JSON.parse(localStorage.getItem("projects")) || [];

const addProjectBtn = document.getElementById("addProjectBtn");
const sidebarAddProjectLink = document.getElementById("sidebarAddProject");
const projectForm = document.getElementById("projectForm");
const saveProject = document.getElementById("saveProject");
const projectTableBody = document.getElementById("projectTableBody");

function resetProjectForm(){
    document.getElementById("projectTitle").value = "";
    document.getElementById("projectDescription").value = "";
    document.getElementById("projectTech").value = "";
    document.getElementById("projectGithub").value = "";
    document.getElementById("projectDemo").value = "";
    document.getElementById("projectImage").value = "";

    delete saveProject.dataset.editIndex;
    saveProject.innerText = "Save Project";
}

function openProjectForm(){
    projectForm.style.display = "block";
}

function toggleProjectForm(){
    if(projectForm.style.display === "block"){
        projectForm.style.display = "none";
        resetProjectForm();
    } else {
        openProjectForm();
    }
}

if(addProjectBtn && projectForm){
    addProjectBtn.addEventListener("click", toggleProjectForm);
}

if(sidebarAddProjectLink && projectForm){
    sidebarAddProjectLink.addEventListener("click", function(e){
        e.preventDefault();
        openProjectForm();
        projectForm.scrollIntoView({ behavior: "smooth" });
    });
}

function displayProjects() {
    if (!projectTableBody) return;

    projectTableBody.innerHTML = "";

    projects.forEach((project, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${project.title}</td>
            <td>${project.tech}</td>
            <td>
                <a href="${project.github}" target="_blank" rel="noopener">
                    GitHub
                </a>
            </td>
            <td>
                <button class="editBtn" data-index="${index}">Edit</button>
                <button class="deleteBtn" data-index="${index}">Delete</button>
            </td>
        `;
        projectTableBody.appendChild(row);
    });
}

if(saveProject){
    saveProject.addEventListener("click", function(){

        const title = document.getElementById("projectTitle").value.trim();
        const description = document.getElementById("projectDescription").value.trim();
        const tech = document.getElementById("projectTech").value.trim();
        const github = document.getElementById("projectGithub").value.trim();
        const demo = document.getElementById("projectDemo").value.trim();
        const image = document.getElementById("projectImage").value.trim();

        if(title === "" || tech === "" || github === ""){
            alert("Please fill all required fields");
            return;
        }

        const projectData = { title, description, tech, github, demo, image };

        if(saveProject.dataset.editIndex !== undefined){
            const editIndex = saveProject.dataset.editIndex;
            projects[editIndex] = projectData;
        } else {
            projects.push(projectData);
        }

        localStorage.setItem("projects", JSON.stringify(projects));
        displayProjects();
        projectForm.style.display = "none";
        resetProjectForm();
    });
}

document.addEventListener("click", function (e) {
    if (e.target.classList.contains("deleteBtn")) {
        const index = e.target.dataset.index;
        if(confirm("Delete this project?")){
            projects.splice(index, 1);
            localStorage.setItem("projects", JSON.stringify(projects));
            displayProjects();
        }
    }

    if (e.target.classList.contains("editBtn")) {
        const index = e.target.dataset.index;
        const project = projects[index];

        document.getElementById("projectTitle").value = project.title || "";
        document.getElementById("projectDescription").value = project.description || "";
        document.getElementById("projectTech").value = project.tech || "";
        document.getElementById("projectGithub").value = project.github || "";
        document.getElementById("projectDemo").value = project.demo || "";
        document.getElementById("projectImage").value = project.image || "";

        projectForm.style.display = "block";
        saveProject.innerText = "Update Project";
        saveProject.dataset.editIndex = index;
    }
});

displayProjects();