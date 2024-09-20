package com.jinn.directorytoolbox

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.vfs.VirtualFile
import java.io.File

class CreateFeatureDirectoryAction: AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return // Get the current project

        // 1. Get the selected directory
        val selectedFile = e.getData(com.intellij.openapi.actionSystem.CommonDataKeys.VIRTUAL_FILE)
        val baseDir = if (selectedFile?.isDirectory == true) selectedFile else selectedFile?.parent

        // 2. Show input dialog for feature name
        val featureName = Messages.showInputDialog(project, "Enter feature name:", "Create Feature Directory", null)
        if (featureName.isNullOrEmpty()) return // If cancelled or no input, do nothing

        // 3. Create the directory structure
        createFeatureDirectory(baseDir, featureName)

        // 4. Refresh the project view to show the new directories
        baseDir?.refresh(false, true)
    }

    private fun createFeatureDirectory(baseDir: VirtualFile?, featureName: String) {
        if (baseDir == null) return

        val featureDir = File(baseDir.path, featureName)
        featureDir.mkdirs()

        val dataDir = File(featureDir, "data")
        dataDir.mkdirs()
        File(dataDir, "data_source").mkdirs()
        File(dataDir, "data_source/${featureName}_data_source.dart").createNewFile()
        File(dataDir, "data_source/${featureName}_data_source_impl.dart").createNewFile()
        File(dataDir, "repository").mkdirs()
        File(dataDir, "repository/${featureName}_repository_impl.dart").createNewFile()
        File(dataDir, "model").mkdirs()

        val domainDir = File(featureDir, "domain")
        domainDir.mkdirs()
        File(domainDir, "entity").mkdirs()
        File(domainDir, "repository").mkdirs()
        File(domainDir, "repository/${featureName}_repository.dart").createNewFile()
        File(domainDir, "use_case").mkdirs()

        val presentationDir = File(featureDir, "presentation")
        presentationDir.mkdirs()
        val sharedDir = File(presentationDir, "shared")
        sharedDir.mkdirs()
        File(sharedDir, "widget").mkdirs()
        File(sharedDir, "riverpod").mkdirs()
        val feature1Dir = File(presentationDir, "feature_1")
        feature1Dir.mkdirs()
        File(feature1Dir, "view").mkdirs()
        File(feature1Dir, "widget").mkdirs()
        File(feature1Dir, "riverpod").mkdirs()
    }
}