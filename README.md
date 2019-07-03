# Concrete5 Packager
![Concrete5 Packager](/src/assets/concrete5-packager-logo-full.svg "Concrete5 Packager")
## Technical Description
This app is built with:

- [Electron](https://electronjs.org/ "Electron.org")
- [Quasar Framework](https://quasar-framework.org/ "Quasar Framework")
- [VueJs](https://vuejs.org/ "VueJs")
- Plenty of open source NodeJs projects (check package.json)

Tested on Windows and Mac (thank you Ryan @mesuva)

## How to run
First intall the Quasar Framework from the command line (this installs it globally)
> npm install -g quasar-cli

Then install all dependencies using NPM from within the project folder
> npm install

Finally run the app with the following command
> quasar dev -m electron

On Mac you might get an error message saying you also need to run the following command
> npm install --save aws-sdk

## Usage

**This Electron desktop app lets you zip Concrete5 packages.**

For now this is what it does:

You add as many Concrete5 roots as you want.

The app automatically lists all the packages for each root with their icon, name and handle.

You specify a destination folder or leave it on default.

When you select a package to zip, it is automatically copied to the destination folder in a "build" folder.

Some common files and folders are automatically ignored like .git, hidden files... And you can set your own exclusions.

The app checks the package for missing `defined('C5_EXECUTE') or die("Access Denied.")` and adds the missing ones. Any "vendor" folder in the package is automatically ignored for that step.

It then zips the package and puts it in a "release" folder inside the destination folder. The copy in the "build" folder is deleted.

## Settings
So far the app has the following settings:

- the destination folder
- whether to delete the build folder after zipping up the package
- whether to add missing `defined('C5_EXECUTE') or die("Access Denied.")`
- custom exclusions (specific files and folders and file extensions)


## To do
- ~~Add a button to open the destination folder easily~~
- ~~Add an option to exclude more files and folders~~
- Add an option to exclude files and folders per package (maybe)
- Add an option to run Composer on the package
- Add an option to only check the package (not zip) and give a detailed report
- Add the possibility to upload it directly to the marketplace (possibly hacky)
