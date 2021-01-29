# Contributing to Volt

:star2: Thank you for taking the time to contribute! You are very much appreciated! :star2:

The following is a set of guidelines for contributing to Volt. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#code-of-conduct">Code of Conduct</a></li>
    <li>
      <a href="#what-should-i-know-before-i-get-started">What should I know before I get started?</a>
      <ul>
        <li><a href="#project-structure">Project structure</a></li>
        <li><a href="#debugging">Debugging</a></li>
        <li><a href="#autorest-generated-code">AutoRest generated code</a></li>
      </ul>
    </li>
    <li>
      <a href="#how-can-i-contribute">How can I contribute?</a>
      <ul>
        <li><a href="#reporting-bugs">Reporting bugs</a></li>
        <li><a href="#suggesting-features">Suggesting features</a></li>
        <li><a href="#pull-requests">Pull requests</a></li>
      </ul>
    </li>
  </ol>
</details>

## Code of Conduct

There is no formal Code of Conduct yet. In the meantime, please behave sincerely and responsibly and report any unacceptable behavior to [sebastiean.gatti@gmail.com](mailto:sebastiean.gatti@gmail.com).

## What should I know before I get started?

### Project structure

Volt is heavily based on [Azurite](https://github.com/Azure/Azurite) - so if you are familiar with the project structure there, then you will have no problem understanding Volt's structure.

If not, don't despair! This section will try to give you an overview of the structure and patterns used in this project.

#### Folder structure

 * `/src` - The TypeScript source code for Volt
 * `/tests` - Contains tests and helpers
 * `/swagger` - Swagger definitions used in code generation (see: [AutoRest generated code](#autorest-generated-code))
 * `/.vscode` - VSCode debugging configuration

#### Source code structure

##### Datastore

Object information and metadata is stored and persisted within a DataStore, which are located in the `/persistance` sub-folder. Currently, this project utilises [LokiJS](https://github.com/techfort/LokiJS) as the only persistance layer, but in the future this could be expanded to other options.

##### Handlers

Each [Key Vault REST API](https://docs.microsoft.com/en-us/rest/api/keyvault/) should map to a single `Handler` class. This class is responsible for interacting with the relevant DataStore to read/write object data. These are located within the `/handlers` sub-folder.
 
##### Generated

Within the `/generated` sub-folder, exists some auto-generated code. However - at this time, not all the code within this folder is actually auto-generated. The code within `/artifacts` and `/handlers` is generated and should not require any manual changes.

### Debugging :ant:

We have provided some predefined Visual Studio Code (VSCode) debugging configurations. This makes it easy to debug in Visual Studio Code.   
Please follow the official [debugging guide](https://code.visualstudio.com/docs/editor/debugging) if you are unsure how to enable debugging in VSCode.

#### Debugging tests

There is a predefined VSCode debugging configuration that will enable debugging and run the tests. This is extremely useful when encountering issues whilst adding new tests.   
Select the `Mocha Tests` debugging configuration in VSCode.

### AutoRest generated code

Like Azurite, Volt utilises [AutoRest](https://github.com/Azure/autorest) to generate code from Swagger / OpenAPI specifications. More commonly, this tool is used to generate Azure's client SDKs, however it is also possible to use a modified AutoRest extension to generate server-side code.
   
The earlier versions of Azurite used this open-source fork of the AutoRest TypeScript extension: https://github.com/XiaoningLiu/autorest.typescript.server 
This is no longer maintained and the latest version does not seem to be open-source.

To auto-generate the server-side code for Volt, some changes to this extension were required. This is available here: https://github.com/sebastiean/autorest.typescript.server


#### Regenerating the code

If a change is required to the Swagger specification or Volt requires and upgrade to support a newer version of the Key Vault REST API, then regeration of the auto-generated code will be necessary.
   
To regenerate the code using AutoRest and the extension, follow the steps below;

1. Install AutoRest using npm

```bash
npm install -g autorest
```

2. Clone the AutoRest TypeScript server extension

```bash
git clone --recursive https://github.com/sebastiean/autorest.typescript.server
```

3. Go to cloned autorest.typescript.server folder and build

```bash
cd autorest.typescript.server
npm install
npm install -g gulp
npm run build
```

4. Within the Volt project folder, run the following command (specify the path to cloned AutoRest extension):

```bash
autorest ./swagger/README.md --typescript --use=/path/to/cloned/autorest.typescript.server
```

## How can I contribute?

### Reporting bugs

This section guides you through submitting a bug report for Volt. Following these guidelines helps maintainers and the community understand your report :pencil:, reproduce the behavior :computer: :computer:, and find related reports :mag_right:.

Before creating bug reports, please check [this list](#before-submitting-a-bug-report) as you might find out that you don't need to create one. When you are creating a bug report, please **include as much detail as possible**.

> **Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

#### Before submitting a bug report

* **Check if you can reproduce the problem in the latest version of Volt**.
* **Perform a search in the [issues](https://github.com/sebastiean/volt/issues?q=is%3Aissue)** to see if the problem has already been reported. If it has **and the issue is still open**, add a comment to the existing issue instead of opening a new one.

### Suggesting features

This section guides you through submitting a feature suggestion for Volt, including completely new features and minor improvements to existing functionality. Following these guidelines helps maintainers and the community understand your suggestion :pencil: and find related suggestions :mag_right:.

#### Before submitting a feature suggestion

* **Perform a [cursory search](https://github.com/sebastiean/volt/issues)** to see if the feature has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.

#### How do I submit a (good) feature suggestion?

Feature suggestions are tracked as [GitHub issues](https://guides.github.com/features/issues/). [Create an issue](https://github.com/sebastiean/volt/issues/new) and provide the following information:

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested feature** in as many details as possible.
* **Provide specific examples to demonstrate the steps**. Include copy/pasteable snippets which you use in those examples, as [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines).
* **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
* **Explain why this feature would be useful.**
* **Specify which version of Volt you're using.**
* **Specify the name and version of the OS you're using.**