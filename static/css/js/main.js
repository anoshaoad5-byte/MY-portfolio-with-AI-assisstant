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
   Login now submits as a real form POST to Flask's /admin/login
   route (see app.py), which checks the database-backed session.
   No JS interception needed here anymore.
========================================== */

/* ==========================================
   ADD PROJECT FORM TOGGLE (dashboard)
   The form itself now submits as a real POST to /admin/add_project
   (see app.py) — this script only opens/closes it.
========================================== */

const addProjectBtn = document.getElementById("addProjectBtn");
const sidebarAddProjectLink = document.getElementById("sidebarAddProject");
const projectForm = document.getElementById("projectForm");

function openProjectForm(){
    if (projectForm) projectForm.style.display = "block";
}

function toggleProjectForm(){
    if (!projectForm) return;
    if (projectForm.style.display === "block") {
        projectForm.style.display = "none";
    } else {
        openProjectForm();
    }
}

if (addProjectBtn && projectForm) {
    addProjectBtn.addEventListener("click", toggleProjectForm);
}

if (sidebarAddProjectLink && projectForm) {
    sidebarAddProjectLink.addEventListener("click", function (e) {
        e.preventDefault();
        openProjectForm();
        projectForm.scrollIntoView({ behavior: "smooth" });
    });
}
/* ==========================================
   VEDHI CHAT WIDGET
========================================== */

const vedhiBubble = document.getElementById("vedhiBubble");
const vedhiPanel = document.getElementById("vedhiPanel");
const vedhiClose = document.getElementById("vedhiClose");
const vedhiForm = document.getElementById("vedhiForm");
const vedhiFeedback = document.getElementById("vedhiFeedback");

if(vedhiBubble && vedhiPanel){
    vedhiBubble.addEventListener("click", function(){
        vedhiPanel.style.display = (vedhiPanel.style.display === "block") ? "none" : "block";
    });
}

if(vedhiClose && vedhiPanel){
    vedhiClose.addEventListener("click", function(){
        vedhiPanel.style.display = "none";
    });
}

if(vedhiForm){
    vedhiForm.addEventListener("submit", function(e){
        e.preventDefault();

        const name = document.getElementById("vedhiName").value.trim();
        const email = document.getElementById("vedhiEmail").value.trim();
        const message = document.getElementById("vedhiMessage").value.trim();

        if(!name || !email || !message){
            vedhiFeedback.style.color = "red";
            vedhiFeedback.innerText = "Please fill in all fields.";
            return;
        }

        fetch("/api/vedhi/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, message })
        })
        .then(res => res.json())
        .then(data => {
            if(data.ok){
                vedhiFeedback.style.color = "green";
                vedhiFeedback.innerText = "Message sent! Anosha will get back to you soon.";
                vedhiForm.reset();
            } else {
                vedhiFeedback.style.color = "red";
                vedhiFeedback.innerText = data.error || "Something went wrong.";
            }
        })
        .catch(() => {
            vedhiFeedback.style.color = "red";
            vedhiFeedback.innerText = "Could not send message. Please try again.";
        });
    });
}
/* ==========================================
   ADMIN DASHBOARD — LIVE UNREAD BADGE
   Only runs on the dashboard (guarded by element check),
   so it has zero effect on any public page.
========================================== */

const adminUnreadBadge = document.getElementById("adminUnreadBadge");

if(adminUnreadBadge){
    let lastCount = parseInt(adminUnreadBadge.innerText, 10) || 0;

    setInterval(function(){
        fetch("/api/admin/unread_count")
            .then(res => res.json())
            .then(data => {
                if(data.count > lastCount){
                    adminUnreadBadge.classList.add("pulse");
                    document.title = "(" + data.count + ") New Message — Admin Dashboard";
                    setTimeout(() => adminUnreadBadge.classList.remove("pulse"), 1500);
                }
                adminUnreadBadge.innerText = data.count;
                lastCount = data.count;
            })
            .catch(() => {});
    }, 20000);
}