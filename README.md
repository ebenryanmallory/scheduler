# AI-Powered Personal Scheduler

A personal task management and scheduling application built with modern web technologies, created through AI pair programming using Cursor editor. This app leverages the power of shadcn/ui components while maintaining a simple, file-based storage system using markdown.

## Overview

This personal scheduler is designed to help manage tasks, time blocks, and schedules across multiple personal computers. It uses Git for synchronization and markdown files for data persistence, making it lightweight and portable.

### Key Features

- ✅ Task Management & To-Do Lists
- 📅 Time Block Scheduling
- 📝 Markdown-Based Storage
- 🔄 Git-Synchronized Data
- 🎨 Modern UI with shadcn/ui Components
- 💻 Cross-Device Compatibility

## Technical Stack

- **Frontend Framework**: React
- **UI Components**: shadcn/ui
- **Storage**: Markdown files
- **Sync**: Git
- **Development Environment**: Cursor Editor with AI assistance

## Project Structure

src/
├── components/ # UI components
├── config/ # Configuration files
├── data/ # Data management
├── docs/ # Markdown storage
└── types/ # TypeScript definitions

## Getting Started

1. Clone the repository:

bash
git clone [your-repo-url]

2. Install dependencies:

bash
npm install

3. Run the development server:

bash
npm run dev

## Storage and Synchronization

The application uses a distributed storage approach:
- Tasks and schedules are stored in markdown files
- Git handles synchronization between devices
- Local changes are automatically committed and pushed
- Conflicts are handled through Git's merge system

## Development

This project was developed through AI pair programming using Cursor editor, demonstrating the potential of AI-assisted development while maintaining high code quality and user experience standards.

## Contributing

This is a personal project, but suggestions and improvements are welcome through issues and pull requests.

## License

MIT License - Feel free to use this code for your personal projects.

---

*Built with AI assistance in Cursor editor, powered by shadcn/ui components*