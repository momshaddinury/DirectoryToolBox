# Directory ToolBox

This plugin simplifies the creation of feature directories in your project. With a single action, it generates a complete directory structure for a new feature, including data, domain, and presentation layers. This helps maintain a consistent project structure and speeds up the development process.

Currently, it generates folder structures for clean architecture and supports Flutter. Soon, it will support other architectures and design patterns.

## Features

- **Feature Directory Generator**: Automatically creates a standardized directory structure for new features, following best practices in layered architecture.

- **Commands**:
  - `extension.createFeatureDirectory`: Prompts for a feature name, sub-feature names, and a state management option (Riverpod, Bloc, Cubit, or Controller). Generates the complete directory structure including data, domain, and presentation layers with necessary files.
  - `extension.addSubFeatureDirectory`: Allows adding sub-features to an existing feature. Prompts for sub-feature names and state management choice, then updates the presentation layer accordingly.

- **Layered Architecture**:
  - **Data Layer**: Includes directories for data sources (`data_source`), repositories (`repository`), and models (`model`). Generates implementation files like `{featureName}_data_source.dart`.
  - **Domain Layer**: Contains entities (`entity`), repository interfaces (`repository`), and use cases (`use_case`). Creates files such as `{featureName}_repository.dart`.
  - **Presentation Layer**: Consists of shared widgets (`shared/widget`) and state management directories based on the chosen option. Creates sub-feature directories or defaults to `feature_1`.

- **State Management Support**: Generates state management setup for the selected option, integrating with Riverpod, Bloc, Cubit, or Controller patterns.

- **Visual Studio Code Integration**: Utilizes VS Code commands and prompts for seamless interaction, enhancing productivity by automating repetitive setup tasks.

## Release Notes
### 1.0.1
- Added Icon
### 1.0.0
- Initial release of DirectoryToolBox plugin for Visual Studio


