package com.jinn.directorytoolbox

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.ComboBox
import com.intellij.openapi.ui.DialogWrapper
import com.intellij.openapi.vfs.VirtualFile
import java.awt.BorderLayout
import java.awt.GridLayout
import java.io.File
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.JTextField

class CreateFeatureDirectoryAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return // Get the current project

        // 1. Get the selected directory
        val selectedFile = e.getData(com.intellij.openapi.actionSystem.CommonDataKeys.VIRTUAL_FILE)
        val baseDir = if (selectedFile?.isDirectory == true) selectedFile else selectedFile?.parent

        // 2. Show custom input dialog for feature name and state management option
        val dialog = FeatureDirectoryDialog()
        if (!dialog.showAndGet()) return // If cancelled, do nothing

        val featureName = dialog.featureName
        val subFeatureName = dialog.subFeatureName
        val stateManagement = dialog.stateManagement

        if (featureName.isNullOrEmpty()) return // If no input, do nothing

        // 3. Create the directory structure
        createFeatureDirectory(baseDir, featureName, subFeatureName, stateManagement)

        // 4. Refresh the project view to show the new directories
        baseDir?.refresh(false, true)
    }

    private fun createFeatureDirectory(
        baseDir: VirtualFile?,
        featureName: String,
        subFeatureName: String?,
        stateManagement: String
    ) {
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
        File(domainDir, "use_case/${featureName}_use_case.dart").createNewFile()

        val presentationDir = File(featureDir, "presentation")
        presentationDir.mkdirs()
        // Create shared directory
        val sharedDir = File(presentationDir, "shared")
        sharedDir.mkdirs()
        File(sharedDir, "widget").mkdirs()
        createStateManagementDirectories(sharedDir, stateManagement, true)

        // Create feature directories
        if (subFeatureName.isNullOrEmpty()) {
            val feature1Dir = File(presentationDir, "feature_1")
            feature1Dir.mkdirs()
            File(feature1Dir, "view").mkdirs()
            File(feature1Dir, "widget").mkdirs()
            createStateManagementDirectories(feature1Dir, stateManagement, true)
        } else {
            val subFeatureNames = subFeatureName.split(",").map { it.trim() }
            subFeatureNames.forEach {
                val subFeatureDir = File(presentationDir, it)
                subFeatureDir.mkdirs()
                File(subFeatureDir, "view").mkdirs()
                File(subFeatureDir, "widget").mkdirs()
                createStateManagementDirectories(subFeatureDir, stateManagement)
            }
        }

    }

    private fun createStateManagementDirectories(dir: File, stateManagement: String, isEmpty: Boolean = false) {
        when (stateManagement) {
            "Riverpod" -> {
                File(dir, "riverpod").mkdirs()
                if (!isEmpty) File(dir, "riverpod/${dir.name}_provider.dart").createNewFile()
            }

            "Bloc" -> {
                File(dir, "bloc").mkdirs()
                if (!isEmpty) {
                    File(dir, "bloc/${dir.name}_bloc.dart").createNewFile()
                    File(dir, "bloc/${dir.name}_event.dart").createNewFile()
                    File(dir, "bloc/${dir.name}_state.dart").createNewFile()
                }
            }

            "Cubit" -> {
                File(dir, "cubit").mkdirs()
                if (!isEmpty) {
                    File(dir, "cubit/${dir.name}_cubit.dart").createNewFile()
                    File(dir, "cubit/${dir.name}_state.dart").createNewFile()
                }
            }
        }
    }
}

class FeatureDirectoryDialog : DialogWrapper(true) {
    var featureName: String? = null
    var subFeatureName: String? = null
    var stateManagement: String = "Riverpod"

    private val featureNameField = JTextField()
    private val subFeatureNameField = JTextField()
    private val stateManagementOptions = arrayOf("Riverpod", "Bloc", "Cubit")
    private val stateManagementComboBox = ComboBox(stateManagementOptions)

    init {
        init()
        title = "Create Feature Directory"
    }

    override fun createCenterPanel(): JComponent {
        val panel = JPanel(BorderLayout())
        val inputPanel = JPanel(GridLayout(0, 1))

        inputPanel.add(JLabel("Feature name:"))
        inputPanel.add(featureNameField.apply { columns = 30 })

        inputPanel.add(JLabel("Sub feature name (Optional):"))
        inputPanel.add(subFeatureNameField.apply { columns = 30 })

        inputPanel.add(JLabel("Select state management:"))
        inputPanel.add(stateManagementComboBox)

        panel.add(inputPanel, BorderLayout.CENTER)
        return panel
    }

    override fun getPreferredFocusedComponent(): JComponent {
        return featureNameField
    }

    override fun doOKAction() {
        featureName = featureNameField.text
        subFeatureName = subFeatureNameField.text
        stateManagement = stateManagementComboBox.selectedItem as String
        super.doOKAction()
    }
}