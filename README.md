#  DevTube | The Distraction-Free Developer Workspace

**Live Demo:** https://devtube-sable.vercel.app/

## The Vision
Standard video platforms are engineered for passive consumption, making it difficult to escape "tutorial hell." DevTube bridges the gap between passive watching and active coding by transforming technical video learning into an integrated, distraction-free development environment.

##Core Features
*   **Focus-First Player:** A custom regex parser extracts standard YouTube URLs and serves them in an isolated modal stripped of algorithmic recommendations, comments, and sidebars.
*   **Embedded Code Workspace:** A split-screen, auto-saving code editor utilizing persistent client-side storage, allowing users to document logic and test syntax without context-switching.
*   **Gamified Analytics & Retention:** A dynamic data visualization dashboard tracks study time across domains, paired with automated daily coding streaks and interactive topic quizzes.
*   **Engineered UI:** A responsive, glassmorphic interface featuring dynamic theming via CSS Custom Properties and a mathematical 3D particle network rendered using the HTML5 Canvas API.

## Engineering Architecture
Built entirely without high-level frameworks to master foundational browser architecture and client-side web APIs.

*   **Frontend Logic:** Vanilla ES6+ JavaScript handling simulated SPA routing, asynchronous UI updates, and DOM manipulation.
*   **State Management:** Web Storage API (LocalStorage) for persistent user sessions, streak tracking, and caching editor notes.
*   **Styling:** Pure CSS3 utilizing CSS Custom Properties (variables) for modular light/dark mode toggling, Flexbox/Grid for responsive layouts, and backdrop-filters for glassmorphism.
*   **Data Visualization:** Chart.js integration via CDN for rendering customized analytic doughnuts.
*   **Deployment:** Continuous integration and hosting via Vercel.

## Future Scope
To scale the platform from a client-side application to a full-stack ecosystem, the roadmap includes:
*   **Backend Migration:** Architecting a robust Python-based backend to replace local storage, enabling secure user authentication and cross-device data synchronization.
*   **AI Integration:** Exploring the integration of AI APIs to automatically generate technical summaries and key takeaways from the video transcripts directly into the workspace.

## Run Locally
Because this project leverages vanilla web technologies, there are no complex build steps, dependencies, or node modules required.

1. Clone the repository:
   ```bash
  https://github.com/sakshishikha8-cloud/devtube.git
