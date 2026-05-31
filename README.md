# AllTheAnimationsYouNeed 🌟


AllTheAnimationsYouNeed is a high-performance, lightweight, and interactive web animation library and showcase. Built entirely on vanilla JavaScript and optimized with Vite, this repository features a collection of creative canvas visualizers, mathematical attractors, boids flocking algorithms, generative L-systems, physics engines, and audio-reactive ecosystems.

Perfect for creative developers, designers, and web enthusiasts looking to integrate stunning, performant animations into their web applications.

## 🚀 Features
__Diverse Categories:__ 

From matrix digital rain and neural network synapses to fractal trees, bioluminescent storms, and quantum foam drift.


__Audio-Reactive Engines:__ 

Built-in ambient soundscapes and musical engines that dynamically interface with canvas rendering.


__High Performance:__ 

Optimized via vanilla JS canvas drawing loops and a global AnimationManager to prevent memory leaks and frame drops.


__Developer Friendly:__ 

Modular structures making it incredibly easy to isolate, export, or add new algorithmic animations.


## 🛠️ How to Use

Integrating these animations into your own projects is designed to be frictionless.


### Quick Import via CDN (Copy to Clipboard)


You do not need to download the entire repository to use a single animation. Browse the hosted gallery, find an animation you love, and click the "Copy to Clipboard" button.

This will copy a ready-to-use code snippet that imports the necessary files directly from our CDN and initializes the animation on a canvas.


### 🛡️ Important Security Notice
When importing external code directly from a CDN into your website, you are granting that script significant execution privileges in your users' browsers. We strongly encourage you to secure your implementations:

+ Do not run external code blindly: While our CDN is safe, it is a best practice to review the source code of the animation you are importing.

+ Use Subresource Integrity (SRI) or Content Security Policies (CSP): Restrict what imported scripts are allowed to do (e.g., block them from making external network requests).

+ Self-Host for Production: For sensitive or high-traffic production environments, we recommend downloading the specific JavaScript files and hosting them locally within your own secure infrastructure rather than relying on a live CDN link.

## 💻 Self-Hosting Guide
Deploying your own version of the animation showcase is straightforward. Ensure you have Node.js installed on your machine.

1. Clone the Repository
```Bash
git clone https://github.com/valentin-heiderich/AllTheAnimationsYouNeed.git
cd AllTheAnimationsYouNeed
```


2. Install Dependencies
```Bash
npm install
```

3. Run Locally for Development
To start the local development server with Hot Module Replacement (HMR):
```Bash
npm run dev
```

4. Build for Production
To generate minified, production-ready static assets in the dist/ directory:

```Bash
npm run build
```


## ⚖️ Permitted & Prohibited Actions (License Terms)
This project is open-source under the MIT License, but contains strict conditions regarding attribution for forks and redistribution:

✅ What You Are Allowed to Do
Use it for inspiration: Learn from the math, algorithms, and particle rendering pipelines.

+ Personal Integration: Copy specific animation classes directly into your own personal projects via CDN or self-hosting.

+ Self-Host: Host a personal copy of the gallery layout for your own private exploration.

❌ What You Are Prohibited From Doing (Without Strict Attribution)
If you create a fork, publish a modified version, or host a publicly accessible portfolio/gallery website built from this codebase, you MUST comply with the following attribution rules:

__🚨 Mandatory Fork Attribution Policy:__

+ In the GitHub Repository: You must explicitly keep a clear link back to the original repository (https://github.com/valentin-heiderich/AllTheAnimationsYouNeed.git) at the top of your README.md.

+ On the Hosted Website: You MUST display a clearly visible, legible notice on your public-facing website user interface that says:
Original Project by Valentin Heiderich (GitHub: valentin-heiderich) with a direct working hyperlink back to the original source repository.

## 🤝 How to Contribute
Contributions are always welcome!

1. Fork the repository.
 
   _(remembering the attribution policy above (If you fork with GitHub and the repository is linked by default and you only use it for contributing to this project complying with the attribution policy is not necessary))_

2. Create a new descriptive feature branch (git checkout -b feature/amazing-new-animation).

3. Add your new script into src/animations/ inheriting from the BaseAnimation architecture.

4. Register your file in src/animationRegistry.js.

5. Add the corresponding /public/cdn animation file.

6. Commit your changes and open a Pull Request against our master branch.
