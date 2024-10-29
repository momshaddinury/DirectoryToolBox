"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
function activate(context) {
    /**
     * Registers the 'extension.createFeatureDirectory' command.
     *
     * This command performs the following steps:
     * 1. Retrieves the selected directory.
     * 2. Prompts the user for the feature name, sub-feature names, and state management option.
     * 3. Creates the directory structure based on the provided inputs.
     *
     * If the selected directory is not valid, an error message is shown to the user.
     *
     * @param uri - The URI of the selected directory.
     * @returns A disposable that unregisters this command when disposed.
     */
    let createFeatureDisposable = vscode.commands.registerCommand('extension.createFeatureDirectory', async (uri) => {
        const baseDir = await getBaseDirectory(uri);
        if (!baseDir) {
            vscode.window.showErrorMessage('Please select a directory to create the feature in.');
            return;
        }
        const featureName = await promptForFeatureName();
        if (!featureName) {
            return;
        }
        const subFeatureNames = await promptForSubFeatureNames();
        const stateManagement = await promptForStateManagement();
        if (!stateManagement) {
            return;
        }
        createFeatureDirectory(baseDir, featureName, subFeatureNames, stateManagement);
        vscode.window.showInformationMessage(`Feature directory '${featureName}' created successfully.`);
    });
    /**
     * Registers the command 'extension.addSubFeatureDirectory' which allows users to add sub-feature directories
     * to a selected feature directory in a Visual Studio Code extension.
     *
     * The command performs the following steps:
     * 1. Retrieves the selected directory.
     * 2. Finds the feature directory within the selected directory.
     * 3. Prompts the user for sub-feature names.
     * 4. Prompts the user for a state management option.
     * 5. Adds sub-feature directories under the 'presentation' folder of the feature directory.
     *
     * If any step fails, an appropriate error message is shown to the user.
     *
     * @param uri - The URI of the selected directory.
     */
    let addSubFeatureDisposable = vscode.commands.registerCommand('extension.addSubFeatureDirectory', async (uri) => {
        let selectedDir = await getBaseDirectory(uri);
        if (!selectedDir) {
            vscode.window.showErrorMessage('Please select a feature directory to add the sub-feature to.');
            return;
        }
        const featureDir = findFeatureDirectory(selectedDir);
        if (!featureDir) {
            vscode.window.showErrorMessage('Could not locate the feature directory. Please select a valid feature directory.');
            return;
        }
        const subFeatureNames = await promptForSubFeatureNames();
        if (subFeatureNames.length === 0) {
            vscode.window.showErrorMessage('Sub-feature name cannot be empty.');
            return;
        }
        const stateManagement = await promptForStateManagement();
        if (!stateManagement) {
            return;
        }
        const presentationDir = path.join(featureDir, 'presentation');
        if (!fs.existsSync(presentationDir)) {
            vscode.window.showErrorMessage('The selected feature directory does not contain a presentation folder.');
            return;
        }
        subFeatureNames.forEach(subFeatureName => {
            const subFeatureDir = path.join(presentationDir, subFeatureName);
            createFeatureSubDirectory(subFeatureDir, stateManagement);
        });
        vscode.window.showInformationMessage(`Sub-feature(s) '${subFeatureNames.join(', ')}' added successfully.`);
    });
    context.subscriptions.push(createFeatureDisposable);
    context.subscriptions.push(addSubFeatureDisposable);
}
/**
 * Retrieves the base directory path from the given URI.
 *
 * @param uri - The URI to check if it is a directory.
 * @returns A promise that resolves to the base directory path as a string if the URI is a directory,
 *          the first workspace folder's path if the URI is not provided or not a directory,
 *          or `undefined` if no workspace folders are available.
 */
async function getBaseDirectory(uri) {
    if (uri && (await isDirectory(uri))) {
        return uri.fsPath;
    }
    else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    else {
        return undefined;
    }
}
/**
 * Checks if the given URI corresponds to a directory.
 *
 * @param uri - The URI to check.
 * @returns A promise that resolves to `true` if the URI is a directory, otherwise `false`.
 */
async function isDirectory(uri) {
    const stat = await vscode.workspace.fs.stat(uri);
    return stat.type === vscode.FileType.Directory;
}
/**
 * Recursively searches for a feature directory starting from the given directory.
 *
 * @param startDir - The directory path to start the search from.
 * @returns The path to the feature directory if found, otherwise `null`.
 *
 * The function traverses up the directory tree from the `startDir` and checks each directory
 * to see if it is a feature directory using the `isFeatureDirectory` function. If it finds
 * a feature directory, it returns the path to that directory. If it reaches the root directory
 * without finding a feature directory, it returns `null`.
 */
function findFeatureDirectory(startDir) {
    let currentDir = startDir;
    while (true) {
        if (isFeatureDirectory(currentDir)) {
            return currentDir;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            return null;
        }
        currentDir = parentDir;
    }
}
/**
 * Checks if the given directory path contains the required subdirectories
 * for a feature directory.
 *
 * @param dirPath - The path of the directory to check.
 * @returns `true` if the directory contains 'data', 'domain', and 'presentation' subdirectories, otherwise `false`.
 */
function isFeatureDirectory(dirPath) {
    const requiredDirs = ['data', 'domain', 'presentation'];
    return requiredDirs.every(dir => fs.existsSync(path.join(dirPath, dir)));
}
/**
 * Prompts the user to input a feature name using an input box.
 *
 * @returns {Promise<string | undefined>} A promise that resolves to the feature name entered by the user,
 * or `undefined` if the input box was canceled.
 */
async function promptForFeatureName() {
    return vscode.window.showInputBox({
        prompt: 'Feature name:',
        validateInput: (value) => (value ? null : 'Feature name cannot be empty'),
    });
}
/**
 * Prompts the user to input sub-feature names via an input box.
 * The user can optionally provide multiple names separated by commas.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array of trimmed sub-feature names.
 */
async function promptForSubFeatureNames() {
    const input = await vscode.window.showInputBox({
        prompt: 'Sub-feature names (optional, separate multiple names with commas):',
    });
    return input ? input.split(',').map((name) => name.trim()) : [];
}
/**
 * Prompts the user to select a state management option from a list.
 *
 * @returns {Promise<string | undefined>} A promise that resolves to the selected state management option, or undefined if no option was selected.
 */
async function promptForStateManagement() {
    const options = ['Riverpod', 'Bloc', 'Cubit', 'Controller'];
    return vscode.window.showQuickPick(options, {
        placeHolder: 'Select state management',
    });
}
/**
 * Creates a directory structure for a feature within a project.
 *
 * @param baseDir - The base directory where the feature directory will be created.
 * @param featureName - The name of the feature for which the directory structure is being created.
 * @param subFeatureNames - An array of sub-feature names to create within the feature's presentation layer.
 * @param stateManagement - The state management strategy to be used (e.g., Redux, Bloc).
 *
 * The function creates the following directory structure:
 * - Data Layer:
 *   - data/
 *     - data_source/
 *       - {featureName}_data_source.dart
 *       - {featureName}_data_source_impl.dart
 *     - repository/
 *       - {featureName}_repository_impl.dart
 *     - model/
 * - Domain Layer:
 *   - domain/
 *     - entity/
 *     - repository/
 *       - {featureName}_repository.dart
 *     - use_case/
 *       - {featureName}_use_case.dart
 * - Presentation Layer:
 *   - presentation/
 *     - shared/
 *       - widget/
 *       - [state management directories based on the provided strategy]
 *     - feature_1/ (or sub-feature directories if provided)
 *
 * The function also creates necessary files within these directories.
 */
function createFeatureDirectory(baseDir, featureName, subFeatureNames, stateManagement) {
    const featureDir = path.join(baseDir, featureName);
    createDir(featureDir);
    createDataLayer(featureDir, featureName);
    createDomainLayer(featureDir, featureName);
    createPresentationLayer(featureDir, subFeatureNames, stateManagement);
}
/**
 * Creates the data layer structure for a given feature.
 *
 * This function generates the necessary directories and files for the data layer
 * of a specified feature within a project. It creates directories for data sources,
 * repositories, and models, and also creates specific Dart files for data sources
 * and repository implementations.
 *
 * @param featureDir - The directory where the feature is located.
 * @param featureName - The name of the feature for which the data layer is being created.
 */
function createDataLayer(featureDir, featureName) {
    const dataDir = path.join(featureDir, 'data');
    createDir(dataDir);
    const dataSourceDir = path.join(dataDir, 'data_source');
    createDir(dataSourceDir);
    createFile(path.join(dataSourceDir, `${featureName}_data_source.dart`));
    createFile(path.join(dataSourceDir, `${featureName}_data_source_impl.dart`));
    const repositoryDir = path.join(dataDir, 'repository');
    createDir(repositoryDir);
    createFile(path.join(repositoryDir, `${featureName}_repository_impl.dart`));
    createDir(path.join(dataDir, 'model'));
}
/**
 * Creates the domain layer structure for a given feature.
 *
 * This function generates the necessary directories and files for the domain layer
 * of a feature in a project. It creates the following structure:
 * - domain/
 *   - entity/
 *   - repository/
 *     - {featureName}_repository.dart
 *   - use_case/
 *     - {featureName}_use_case.dart
 *
 * @param featureDir - The directory where the feature is located.
 * @param featureName - The name of the feature for which the domain layer is being created.
 */
function createDomainLayer(featureDir, featureName) {
    const domainDir = path.join(featureDir, 'domain');
    createDir(domainDir);
    createDir(path.join(domainDir, 'entity'));
    const domainRepositoryDir = path.join(domainDir, 'repository');
    createDir(domainRepositoryDir);
    createFile(path.join(domainRepositoryDir, `${featureName}_repository.dart`));
    const useCaseDir = path.join(domainDir, 'use_case');
    createDir(useCaseDir);
    createFile(path.join(useCaseDir, `${featureName}_use_case.dart`));
}
/**
 * Creates the presentation layer directory structure for a given feature.
 *
 * @param featureDir - The root directory of the feature.
 * @param subFeatureNames - An array of sub-feature names to create directories for.
 *                          If empty, a default 'feature_1' directory will be created.
 * @param stateManagement - The state management strategy to be used (e.g., 'riverpod', 'bloc').
 *
 * This function creates a 'presentation' directory within the given feature directory.
 * Inside the 'presentation' directory, it creates a 'shared' directory with a 'widget' subdirectory.
 * It also sets up state management directories within the 'shared' directory.
 * For each sub-feature name provided, it creates a corresponding subdirectory within the 'presentation' directory.
 * If no sub-feature names are provided, it creates a default 'feature_1' subdirectory.
 */
function createPresentationLayer(featureDir, subFeatureNames, stateManagement) {
    const presentationDir = path.join(featureDir, 'presentation');
    createDir(presentationDir);
    const sharedDir = path.join(presentationDir, 'shared');
    createDir(sharedDir);
    createDir(path.join(sharedDir, 'widget'));
    createStateManagementDirectories(sharedDir, stateManagement, true);
    if (subFeatureNames.length === 0) {
        const feature1Dir = path.join(presentationDir, 'feature_1');
        createFeatureSubDirectory(feature1Dir, stateManagement);
    }
    else {
        subFeatureNames.forEach((subFeatureName) => {
            const subFeatureDir = path.join(presentationDir, subFeatureName);
            createFeatureSubDirectory(subFeatureDir, stateManagement);
        });
    }
}
/**
 * Creates a feature subdirectory structure with specified state management.
 *
 * This function creates the main directory, a 'view' subdirectory, a 'widget' subdirectory,
 * and additional state management directories based on the provided state management type.
 *
 * @param dir - The path of the main directory to be created.
 * @param stateManagement - The type of state management to be used (e.g., 'riverpod', 'bloc').
 */
function createFeatureSubDirectory(dir, stateManagement) {
    createDir(dir);
    createDir(path.join(dir, 'view'));
    createDir(path.join(dir, 'widget'));
    createStateManagementDirectories(dir, stateManagement);
}
/**
 * Creates directories and files for state management based on the specified type.
 *
 * @param dir - The base directory where the state management directories will be created.
 * @param stateManagement - The type of state management to use. Can be 'Riverpod', 'Bloc', 'Cubit', or 'Controller'.
 * @param isEmpty - Optional. If true, only the directories will be created without any files. Defaults to false.
 *
 * @remarks
 * This function will create a subdirectory within the specified base directory for the given state management type.
 * If `isEmpty` is false, it will also create the necessary files for the state management type.
 *
 * @example
 * ```typescript
 * createStateManagementDirectories('/path/to/project', 'Bloc');
 * // This will create the following structure:
 * // /path/to/project/bloc/
 * // /path/to/project/bloc/project_bloc.dart
 * // /path/to/project/bloc/project_event.dart
 * // /path/to/project/bloc/project_state.dart
 * ```
 */
function createStateManagementDirectories(dir, stateManagement, isEmpty = false) {
    const dirName = path.basename(dir);
    switch (stateManagement) {
        case 'Riverpod':
            const riverpodDir = path.join(dir, 'riverpod');
            createDir(riverpodDir);
            if (!isEmpty) {
                createFile(path.join(riverpodDir, `${dirName}_provider.dart`));
            }
            break;
        case 'Bloc':
            const blocDir = path.join(dir, 'bloc');
            createDir(blocDir);
            if (!isEmpty) {
                createFile(path.join(blocDir, `${dirName}_bloc.dart`));
                createFile(path.join(blocDir, `${dirName}_event.dart`));
                createFile(path.join(blocDir, `${dirName}_state.dart`));
            }
            break;
        case 'Cubit':
            const cubitDir = path.join(dir, 'cubit');
            createDir(cubitDir);
            if (!isEmpty) {
                createFile(path.join(cubitDir, `${dirName}_cubit.dart`));
                createFile(path.join(cubitDir, `${dirName}_state.dart`));
            }
            break;
        case 'Controller':
            const controllerDir = path.join(dir, 'controller');
            createDir(controllerDir);
            if (!isEmpty) {
                createFile(path.join(controllerDir, `${dirName}_controller.dart`));
            }
            break;
    }
}
/**
 * Creates a directory at the specified path if it does not already exist.
 *
 * @param dirPath - The path of the directory to create.
 */
function createDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Creates a file at the specified path if it does not already exist.
 *
 * @param filePath - The path of the file to create.
 */
function createFile(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map