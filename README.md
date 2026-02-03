# 🎮 LoL

A cinematic, animated homepage tribute to League of Legends.  
Scroll through immersive sections, tilt-reactive visuals, and layered transitions — all client-side.

---

## 🧠 Overview

LoL is a fully front-end showcase site inspired by the world of League of Legends.  
It’s designed as a static experience, hosted on GitHub Pages, with no backend or database.  
The site blends storytelling, animation, and interactive motion to create a rich visual journey.

Each section introduces a different aspect of the game — from champions and lore to gameplay and community — using scroll-based transitions, mouse-reactive tilt effects, and embedded media.

---

## 🔥 Features

- 🖼️ Full-screen hero sections with layered animations  
- 🎥 Embedded video and cinematic transitions  
- 🧭 Scroll-triggered effects (slideIn, fadeIn, parallax)  
- 🖱️ Mouse-based tilt and hover interactions  
- 🧩 Modular React components for each section  
- 📱 Fully responsive layout  
- ⚡ Instant loading via static hosting  
- 🧙‍♂️ Thematic styling inspired by Runeterra  

---

## 🎬 Animation Highlights

Built with GSAP and ScrollTrigger, the site includes:

- **Clip-path morphing**: dynamic shape transitions on videos and images  
- **Zoom-from-mini-box**: interactive scale/translate from thumbnail to fullscreen  
- **Tilt effects**: rotateX/Y, transformPerspective, parallax, and glow overlays  
- **Scroll pinning**: timeline-based expansion and fade sequences  
- **Text fade-out**: smooth exit animations on scroll  
- **Particles and overlays**: drifting gradients, breathing effects, and mouse trails  
- **Audio tweening**: volume fades and context-aware muting  
- **Lazy video loading**: blur overlays and skeleton guards  
- **Device orientation tilt**: mobile tilt support with throttling  
- **Navbar auto-hide**: scroll-aware floating header  
- **ScrollToPlugin**: smooth navigation between sections  

Each component (Hero, About, Features, Story, Contact) includes custom GSAP timelines and interactive logic.

---

## 🛠️ Tech Stack

**Frontend:**
- React  
- Vite  
- HTML, CSS, JavaScript  
- Tailwind CSS  

**Animations & Media:**
- GSAP  
- @gsap/react  
- ScrollTrigger, ScrollToPlugin  
- React Player  
- React Icons  
- React Use  

**Tooling:**
- ESLint  
- Vite Plugin React  
- GitHub Pages (`gh-pages`)

---

## 👊 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Live Demo
[Try it here](https://mollylamolla.github.io/LeagueOfLegends.App.Deploy/)

## 📄 License
This project is licensed under the ISC License.

